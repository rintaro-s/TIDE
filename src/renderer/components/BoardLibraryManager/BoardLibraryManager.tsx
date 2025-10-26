import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { logger, toast } from '../../utils/logger';
import arduinoService from '../../services/ArduinoService';
import platformIOService from '../../services/PlatformIOService';
import './BoardLibraryManager.css';

// キャッシュストレージキー
const CACHE_KEY_PREFIX = 'tide_cache_';
const CACHE_EXPIRY_MS = 1000 * 60 * 60 * 24; // 24時間

interface BoardManagerProps {
  type: 'board' | 'library';
}

type BoardSource = 'arduino-board' | 'arduino-core' | 'platformio-board';

interface Board {
  id: string;
  name: string;
  platform: string;
  version?: string;
  description?: string;
  website?: string;
  maintainer?: string;
  installTarget?: string;
  source?: BoardSource;
}

interface Library {
  name: string;
  version: string;
  author?: string;
  description?: string;
  website?: string;
  availableVersions?: string[];
  selectedVersion?: string;
}

const extractFirstString = (value: any): string | undefined => {
  if (value == null) return undefined;
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = extractFirstString(entry);
      if (found) return found;
    }
    return undefined;
  }
  if (typeof value === 'object') {
    for (const key of Object.keys(value)) {
      const found = extractFirstString((value as Record<string, any>)[key]);
      if (found) return found;
    }
  }
  return undefined;
};

const extractPlatformName = (platform: any): string => {
  const direct = extractFirstString(platform);
  if (direct) return direct;

  if (platform && typeof platform === 'object') {
    const metadataName = extractFirstString(platform.metadata?.name) || extractFirstString(platform.metadata?.displayName);
    if (metadataName) return metadataName;
    const core = extractFirstString(platform.core);
    if (core) return core;
    const pkg = extractFirstString(platform.package);
    if (pkg) return pkg;
  }

  return 'Unknown';
};

const normalizeBoardItem = (raw: any): Board => {
  const platformName = extractPlatformName(raw?.platform);
  const version = extractFirstString(raw?.version) 
    || extractFirstString(raw?.platform?.release?.version)
    || extractFirstString(raw?.metadata?.version)
    || undefined;

  const idCandidate = extractFirstString(raw?.fqbn)
    || extractFirstString(raw?.id)
    || extractFirstString(raw?.board)
    || undefined;

  const name = extractFirstString(raw?.name)
    || idCandidate
    || extractFirstString(raw?.label)
    || 'Unknown Board';

  const description = extractFirstString(raw?.description)
    || extractFirstString(raw?.details?.description)
    || extractFirstString(raw?.details?.sentence)
    || undefined;

  const website = extractFirstString(raw?.website)
    || extractFirstString(raw?.url)
    || extractFirstString(raw?.homepage)
    || undefined;

  const maintainer = extractFirstString(raw?.platform?.maintainer)
    || extractFirstString(raw?.maintainer)
    || undefined;

  const installTarget = extractFirstString(raw?.platform?.id)
    || extractFirstString(raw?.platform?.package)
    || extractFirstString(raw?.package)
    || undefined;

  const fallbackId = idCandidate || installTarget || `${name}-${platformName}`;

  return {
    id: String(fallbackId || `${Date.now()}`),
    name: String(name),
    platform: platformName,
    version: version,
    description,
    website,
    maintainer,
    installTarget,
    source: 'arduino-board'
  };
};

const normalizeArduinoCoreItem = (raw: any): Board => {
  const id = extractFirstString(raw?.id)
    || extractFirstString(raw?.ID)
    || extractFirstString(raw?.package)
    || extractFirstString(raw?.Package)
    || 'unknown-core';

  const name = extractFirstString(raw?.name)
    || extractFirstString(raw?.Name)
    || extractFirstString(raw?.title)
    || extractFirstString(raw?.Title)
    || id;

  const maintainer = extractFirstString(raw?.maintainer)
    || extractFirstString(raw?.Maintainer)
    || extractFirstString(raw?.author)
    || extractFirstString(raw?.Author)
    || undefined;

  const latestVersion = extractFirstString(raw?.latest_version)
    || extractFirstString(raw?.latestVersion)
    || extractFirstString(raw?.version)
    || extractFirstString(raw?.Version)
    || undefined;

  const description = extractFirstString(raw?.description)
    || extractFirstString(raw?.Description)
    || extractFirstString(raw?.sentence)
    || extractFirstString(raw?.Sentence)
    || undefined;

  const website = extractFirstString(raw?.website)
    || extractFirstString(raw?.Website)
    || extractFirstString(raw?.url)
    || extractFirstString(raw?.Url)
    || extractFirstString(raw?.URL)
    || extractFirstString(raw?.help)
    || extractFirstString(raw?.Help)
    || extractFirstString(raw?.homepage)
    || extractFirstString(raw?.Homepage)
    || undefined;

  return {
    id,
    name,
    platform: maintainer || 'Unknown',
    version: latestVersion,
    description,
    website,
    maintainer,
    installTarget: id,
    source: 'arduino-core'
  };
};

const normalizeLibraryItem = (raw: any): Library => {
  if (!raw) {
    return {
      name: 'Unknown Library',
      version: '1.0.0'
    };
  }

  const releases = raw.releases || {};
  const availableVersionsRaw = Array.isArray(raw.availableVersions)
    ? raw.availableVersions
    : Object.keys(releases || {}).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  const availableVersions = availableVersionsRaw
    .map((v: any) => extractFirstString(v) || String(v))
    .filter((v: string) => Boolean(v));

  let latest = raw.latest;
  if (!latest && availableVersions.length > 0) {
    latest = releases[availableVersions[0]];
  }
  if (!latest) {
    latest = {};
  }

  const description = extractFirstString(latest.description)
    || extractFirstString(latest.sentence)
    || extractFirstString(raw.description)
    || '';

  const author = extractFirstString(latest.author)
    || extractFirstString(raw.author)
    || undefined;

  const website = extractFirstString(latest.website)
    || extractFirstString(raw.website)
    || undefined;

  const version = extractFirstString(latest.version)
    || extractFirstString(raw.version)
    || availableVersions[0]
    || '1.0.0';

  const versions = availableVersions.length ? availableVersions : [version];

  return {
    name: extractFirstString(raw.name) || 'Unknown Library',
    version,
    author,
    description,
    website,
    availableVersions: versions
  };
};

const normalizePlatformIOBoard = (raw: any): Board => {
  const id = extractFirstString(raw?.id) || `${extractFirstString(raw?.platform) || 'platformio'}:${extractFirstString(raw?.name) || 'board'}`;
  const name = extractFirstString(raw?.name) || id;
  const platform = extractFirstString(raw?.platform) || 'Unknown';

  const specParts = [
    raw?.mcu ? `MCU: ${raw.mcu}` : null,
    raw?.frequency ? `Freq: ${raw.frequency}` : null,
    raw?.flash ? `Flash: ${raw.flash}` : null,
    raw?.ram ? `RAM: ${raw.ram}` : null
  ].filter(Boolean);

  return {
    id,
    name,
    platform,
    description: specParts.length ? specParts.join(' • ') : undefined,
    maintainer: undefined,
    website: undefined,
    installTarget: platform,
    source: 'platformio-board'
  };
};

const normalizePlatformIOLibrary = (raw: any): Library => {
  const version = extractFirstString(raw?.version?.name)
    || extractFirstString(raw?.version)
    || 'latest';

  const availableVersions = Array.isArray(raw?.versions)
    ? raw.versions
        .map((entry: any) => extractFirstString(entry?.name) || extractFirstString(entry))
        .filter((v: string | undefined): v is string => Boolean(v))
    : version
      ? [version]
      : [];

  return {
    name: extractFirstString(raw?.name) || 'Unknown Library',
    version,
    author: extractFirstString(raw?.author) || undefined,
    description: extractFirstString(raw?.description) || '',
    website: extractFirstString(raw?.homepage) || extractFirstString(raw?.repository?.url) || undefined,
    availableVersions
  };
};

const normalizeArduinoServiceLibrary = (lib: { name?: string; version?: string; author?: string; description?: string }): Library => {
  const version = lib.version || 'latest';

  return {
    name: lib.name || 'Unknown Library',
    version,
    author: lib.author || undefined,
    description: lib.description || '',
    website: undefined,
    availableVersions: [version]
  };
};

const sanitizeItems = (items: any[], type: 'board' | 'library'): (Board | Library)[] => {
  if (!Array.isArray(items)) return [];
  return items.map(item => {
    if (type === 'board') {
      if (typeof item?.platform === 'string' && typeof item?.name === 'string') {
        // Already normalized shape but ensure id & version format
        return {
          id: String(item.id || item.fqbn || item.name),
          name: String(item.name),
          platform: String(item.platform),
          version: item.version && typeof item.version === 'string' ? item.version : undefined,
          description: item.description ? String(item.description) : undefined,
          website: item.website ? String(item.website) : undefined,
          maintainer: item.maintainer ? String(item.maintainer) : undefined,
          installTarget: item.installTarget ? String(item.installTarget) : undefined,
          source: item.source === 'arduino-core' || item.source === 'platformio-board' ? item.source : 'arduino-board'
        } as Board;
      }
      return normalizeBoardItem(item);
    }

    // Library case
    if (Array.isArray(item?.availableVersions) && typeof item?.name === 'string') {
      return {
        ...item,
        name: String(item.name),
        version: typeof item.version === 'string' ? item.version : '1.0.0',
        author: item.author ? String(item.author) : undefined,
        description: item.description ? String(item.description) : '',
        website: item.website ? String(item.website) : undefined,
        availableVersions: item.availableVersions.map((v: any) => String(v))
      } as Library;
    }
    return normalizeLibraryItem(item);
  });
};

const dedupeBoards = (boards: Board[]): Board[] => {
  const map = new Map<string, Board>();
  const ordered: Board[] = [];

  boards.forEach(board => {
    const existing = map.get(board.id);
    if (!existing) {
      map.set(board.id, board);
      ordered.push(board);
      return;
    }

    if (existing.source !== 'arduino-core' && board.source === 'arduino-core') {
      map.set(board.id, board);
      const index = ordered.findIndex(b => b.id === board.id);
      if (index !== -1) {
        ordered[index] = board;
      }
    }
  });

  return ordered;
};

const runArduinoLibrarySearch = async (query: string): Promise<Library[]> => {
  if (!query.trim()) {
    logger.debug('Skipping Arduino library search for empty query to avoid huge payloads');
    return [];
  }

  const command = `arduino-cli lib search ${JSON.stringify(query)} --format json`;

  try {
    const result = await window.electronAPI.executeCommand(command);
    if (result.success && result.output) {
      const parsed = JSON.parse(result.output);
      const libs = parsed.libraries?.map((l: any) => normalizeLibraryItem(l)) || [];
      logger.success(`Arduino library search returned ${libs.length} entries for "${query}"`);
      return libs;
    }

    logger.warning('Arduino library search failed', result.error || 'Unknown error');
    return [];
  } catch (error) {
    logger.error('Arduino library search threw', error instanceof Error ? error.message : String(error));
    return [];
  }
};

const fetchArduinoBoards = async (): Promise<Board[]> => {
  const aggregated: Board[] = [];

  try {
    logger.info('Fetching Arduino boards (listall)...');
    const boardList = await arduinoService.searchAllBoards('');
    aggregated.push(...boardList.map(normalizeBoardItem));
    logger.success(`Collected ${boardList.length} boards from listall`);
  } catch (error) {
    logger.error('Failed to fetch Arduino boards', error instanceof Error ? error.message : String(error));
  }

  try {
    logger.info('Fetching Arduino core packages...');
    const cores = await arduinoService.searchCorePackages('');
    aggregated.push(...cores.map(normalizeArduinoCoreItem));
    logger.success(`Collected ${cores.length} board cores`);
  } catch (error) {
    logger.error('Failed to fetch Arduino board cores', error instanceof Error ? error.message : String(error));
  }

  return dedupeBoards(aggregated);
};

const fetchPlatformIOBoards = async (): Promise<Board[]> => {
  try {
    logger.info('Fetching PlatformIO boards...');
    const boards = await platformIOService.listAllBoards();
    const normalized = boards.map(normalizePlatformIOBoard);
    logger.success(`Collected ${normalized.length} PlatformIO boards`);
    return normalized;
  } catch (error) {
    logger.error('Failed to fetch PlatformIO boards', error instanceof Error ? error.message : String(error));
    return [];
  }
};

const fetchArduinoLibraries = async (): Promise<Library[]> => {
  try {
    logger.info('Fetching Arduino libraries (seed query: "arduino")...');
    const libs = await arduinoService.searchLibraries('arduino');
    const normalized = libs.map(normalizeArduinoServiceLibrary);
    logger.success(`Seeded ${normalized.length} Arduino libraries`);
    return normalized;
  } catch (error) {
    logger.error('Failed to fetch Arduino libraries', error instanceof Error ? error.message : String(error));
    return [];
  }
};

const fetchPlatformIOLibraries = async (): Promise<Library[]> => {
  try {
    logger.info('Fetching PlatformIO installed libraries...');
    const libs = await platformIOService.listInstalledLibraries();
    const normalized = libs.map(normalizePlatformIOLibrary);
    logger.success(`Collected ${normalized.length} PlatformIO libraries`);
    return normalized;
  } catch (error) {
    logger.error('Failed to fetch PlatformIO libraries', error instanceof Error ? error.message : String(error));
    return [];
  }
};

const searchArduinoBoardsRemote = async (query: string): Promise<Board[]> => {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const aggregated: Board[] = [];

  try {
    const boards = await arduinoService.searchBoards(trimmed);
    if (boards.length) {
      aggregated.push(...boards.map(normalizeBoardItem));
    }
  } catch (error) {
    logger.error('Arduino board search failed', error instanceof Error ? error.message : String(error));
  }

  try {
    const cores = await arduinoService.searchCorePackages(trimmed);
    if (cores.length) {
      aggregated.push(...cores.map(normalizeArduinoCoreItem));
    }
  } catch (error) {
    logger.error('Arduino core search failed', error instanceof Error ? error.message : String(error));
  }

  return dedupeBoards(aggregated);
};

const searchArduinoLibrariesRemote = async (query: string): Promise<Library[]> => {
  if (query.length < 2) {
    const fallback = await arduinoService.searchLibraries(query);
    return fallback.map(normalizeArduinoServiceLibrary);
  }

  const detailed = await runArduinoLibrarySearch(query);
  if (detailed.length) {
    return detailed;
  }

  const fallback = await arduinoService.searchLibraries(query);
  return fallback.map(normalizeArduinoServiceLibrary);
};

const searchPlatformIOBoardsRemote = async (query: string): Promise<Board[]> => {
  try {
    const boards = await platformIOService.searchBoards(query);
    return boards.map(normalizePlatformIOBoard);
  } catch (error) {
    logger.error('PlatformIO board search failed', error instanceof Error ? error.message : String(error));
    return [];
  }
};

const searchPlatformIOLibrariesRemote = async (query: string): Promise<Library[]> => {
  try {
    const libs = await platformIOService.searchLibraries(query);
    return libs.map(normalizePlatformIOLibrary);
  } catch (error) {
    logger.error('PlatformIO library search failed', error instanceof Error ? error.message : String(error));
    return [];
  }
};

const filterItemsLocal = (itemsList: (Board | Library)[], queryRaw: string): (Board | Library)[] => {
  const normalizedQuery = queryRaw.trim().toLowerCase();
  if (!normalizedQuery) return itemsList;

  return itemsList.filter(item => {
    const name = item.name.toLowerCase();
    if ('platform' in item) {
      const platform = item.platform.toLowerCase();
      const description = (item.description || '').toLowerCase();
      return name.includes(normalizedQuery) || platform.includes(normalizedQuery) || description.includes(normalizedQuery);
    }

    const desc = (item.description || '').toLowerCase();
    const author = (item.author || '').toLowerCase();
    return name.includes(normalizedQuery) || desc.includes(normalizedQuery) || author.includes(normalizedQuery);
  });
};

const BoardLibraryManager: React.FC<BoardManagerProps> = ({ type }) => {
  const { mode } = useApp();
  const [items, setItems] = useState<(Board | Library)[]>([]);
  const [filteredItems, setFilteredItems] = useState<(Board | Library)[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [installing, setInstalling] = useState<Set<string>>(new Set());
  const [selectedVersions, setSelectedVersions] = useState<Map<string, string>>(new Map());
  const [cacheInfo, setCacheInfo] = useState<{ lastUpdate: number; source: string } | null>(null);

  // キャッシュ関連の関数
  const getCacheKey = (cacheType: string) => `${CACHE_KEY_PREFIX}${mode}_${cacheType}_${type}`;
  
  const getCachedData = (cacheType: string) => {
    try {
      const key = getCacheKey(cacheType);
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is expired
      if (now - data.timestamp > CACHE_EXPIRY_MS) {
        localStorage.removeItem(key);
        return null;
      }
      
      // Validate cached data - ensure no objects in availableVersions
      const validatedItems = data.items?.map((item: any) => {
        if (item.availableVersions && typeof item.availableVersions === 'object' && !Array.isArray(item.availableVersions)) {
          return {
            ...item,
            availableVersions: Object.keys(item.availableVersions)
          };
        }
        return item;
      });
      
      setCacheInfo({ lastUpdate: data.timestamp, source: 'cache' });
      return validatedItems;
    } catch (error) {
      console.error('Failed to load cached data:', error);
      // Clear corrupted cache
      try {
        const key = getCacheKey(cacheType);
        localStorage.removeItem(key);
      } catch (e) {
        // ignore
      }
      return null;
    }
  };

  const setCachedData = (cacheType: string, items: any[]) => {
    try {
      const key = getCacheKey(cacheType);
      const data = {
        timestamp: Date.now(),
        items: items
      };
      localStorage.setItem(key, JSON.stringify(data));
      setCacheInfo({ lastUpdate: data.timestamp, source: 'network' });
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  };

  const clearCache = () => {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(CACHE_KEY_PREFIX));
      keys.forEach(key => localStorage.removeItem(key));
      setCacheInfo(null);
      toast.success('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      toast.error('Failed to clear cache');
    }
  };

  // 初期データロード
  useEffect(() => {
    if (mode) {
      loadItems();
    }
  }, [mode, type]);

  // 検索フィルタリング
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredItems(items);
      return;
    }
    setFilteredItems(filterItemsLocal(items, searchText));
  }, [searchText, items]);

  const loadItems = async (forceRefresh = false) => {
    if (!mode) return;

    // キャッシュから読み込みを試行
    if (!forceRefresh) {
      const cachedData = getCachedData('items');
      if (cachedData) {
        const sanitized = sanitizeItems(cachedData, type);
        setItems(sanitized);
        setFilteredItems(sanitized);
        return;
      }
    }

    setLoading(true);
    try {
      let data: (Board | Library)[] = [];

      if (type === 'board') {
        if (mode === 'arduino') {
          data = await fetchArduinoBoards();
        } else if (mode === 'platformio') {
          data = await fetchPlatformIOBoards();
        }
      } else {
        if (mode === 'arduino') {
          data = await fetchArduinoLibraries();
        } else if (mode === 'platformio') {
          data = await fetchPlatformIOLibraries();
        }
      }

      const sanitized = sanitizeItems(data, type);

      // キャッシュに保存
      setCachedData('items', sanitized);

      setItems(sanitized);
      setFilteredItems(sanitized);
    } catch (error) {
      console.error(`Failed to load ${type}s:`, error);
      // エラー時は空配列を表示
      setItems([]);
      setFilteredItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const term = searchText.trim();
    if (!term) {
      // 検索語句が空の場合は全アイテムを表示
      setFilteredItems(items);
      return;
    }

    const localResults = filterItemsLocal(items, term);
    if (localResults.length > 0) {
      setFilteredItems(localResults);
      return;
    }

    if (!mode) {
      toast.error('モードが未選択のため検索できません');
      return;
    }

    setLoading(true);
    try {
      let remote: (Board | Library)[] = [];

      if (type === 'board') {
        remote = mode === 'arduino'
          ? await searchArduinoBoardsRemote(term)
          : await searchPlatformIOBoardsRemote(term);
      } else {
        remote = mode === 'arduino'
          ? await searchArduinoLibrariesRemote(term)
          : await searchPlatformIOLibrariesRemote(term);
      }

      const sanitizedRemote = sanitizeItems(remote, type);
      setFilteredItems(sanitizedRemote);

      if (sanitizedRemote.length === 0) {
        toast.info('該当する結果が見つかりませんでした');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('Remote search failed', errorMsg);
      toast.error('検索に失敗しました', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async (item: Board | Library) => {
    const itemId = 'id' in item ? item.id : item.name;
    
    if (installing.has(itemId)) return;

    setInstalling(prev => new Set(prev).add(itemId));

    try {
      if (type === 'board') {
        if (!isBoard(item)) {
          toast.error('ボード情報が無効です');
          return;
        }

        if (!mode) {
          toast.error('モードが未選択のためインストールできません');
          return;
        }

        if (mode === 'arduino') {
          const target = item.installTarget || item.id;
          if (!target) {
            toast.error('インストール対象のコアが特定できません');
            return;
          }

          const installSpecifier = item.version ? `${target}@${item.version}` : target;

          try {
            const existing = await window.electronAPI.process.exec('arduino-cli', ['core', 'list', '--format', 'json']);
            if (existing.exitCode === 0 && existing.stdout) {
              try {
                const parsed = JSON.parse(existing.stdout);
                const installedPlatforms = parsed.installed_platforms || parsed.platforms || [];
                const alreadyInstalled = installedPlatforms.some((p: any) => {
                  const candidateId = extractFirstString(p?.id) || extractFirstString(p?.ID) || extractFirstString(p?.name);
                  return candidateId === target || candidateId === installSpecifier;
                });

                if (alreadyInstalled) {
                  toast.info('既にインストール済み', `${item.name} はすでにインストールされています`);
                  return;
                }
              } catch (parseError) {
                logger.warning('Failed to parse installed cores', parseError instanceof Error ? parseError.message : String(parseError));
              }
            }
          } catch (checkError) {
            logger.warning('Failed to check installed cores', checkError instanceof Error ? checkError.message : String(checkError));
          }

          logger.info(`Installing Arduino core: ${installSpecifier}`);
          const result = await window.electronAPI.process.exec('arduino-cli', ['core', 'install', installSpecifier]);

          if (result.exitCode === 0) {
            logger.success(`Installed Arduino core ${installSpecifier}`);
            toast.success('コアをインストール', `${item.name} (${installSpecifier}) をインストールしました`);
          } else {
            const errorMsg = result.stderr || 'Unknown error';
            logger.error('Arduino core installation failed', errorMsg);
            toast.error('インストール失敗', errorMsg);
          }
        } else if (mode === 'platformio') {
          const target = item.installTarget || item.platform;
          if (!target) {
            toast.error('インストール対象のプラットフォームが特定できません');
            return;
          }

          const installSpecifier = item.version ? `${target}@${item.version}` : target;
          logger.info(`Installing PlatformIO platform: ${installSpecifier}`);
          const success = await platformIOService.installPlatform(installSpecifier);

          if (success) {
            logger.success(`Installed PlatformIO platform ${installSpecifier}`);
            toast.success('プラットフォームをインストール', `${item.name} (${installSpecifier}) をインストールしました`);
          } else {
            toast.error('インストール失敗', `${item.name} のプラットフォームをインストールできませんでした`);
          }
        } else {
          toast.error('未対応のモードです');
        }
      } else {
        // ライブラリのインストール
        if (mode === 'arduino') {
          const lib = item as Library;
          const selectedVersion = selectedVersions.get(lib.name) || lib.version;
          
          // First check if already installed
          try {
            const result = await window.electronAPI.process.exec('arduino-cli', ['lib', 'list', '--format', 'json']);
            if (result.exitCode === 0 && result.stdout) {
              try {
                const installed = JSON.parse(result.stdout);
                const libs = installed.installed_libraries || installed.libraries || [];
                const alreadyInstalled = libs.some((l: any) => (l.name || '').toLowerCase() === lib.name.toLowerCase());
                if (alreadyInstalled) {
                  logger.info(`Library "${lib.name}" is already installed`);
                  toast.info('既にインストール済み', `${lib.name} はすでにインストールされています`);
                  return;
                }
              } catch (parseError) {
                logger.warning('Failed to parse installed libraries list', parseError instanceof Error ? parseError.message : String(parseError));
              }
            }
          } catch (error) {
            logger.warning('Failed to check Arduino libraries', error instanceof Error ? error.message : String(error));
          }

          const specifier = `${lib.name}@${selectedVersion}`;
          logger.info(`Installing Arduino library: ${specifier}`);
          const installResult = await window.electronAPI.process.exec('arduino-cli', ['lib', 'install', specifier]);

          if (installResult.exitCode === 0) {
            logger.success(`Library "${specifier}" installed successfully`);
            toast.success('ライブラリをインストール', `${lib.name} v${selectedVersion} をインストールしました`);
          } else {
            const errorMsg = installResult.stderr || 'Unknown error';
            logger.error(`Installation failed for ${lib.name}`, errorMsg);
            toast.error('インストール失敗', errorMsg);
          }
        } else if (mode === 'platformio') {
          const lib = item as Library;
          const selectedVersion = selectedVersions.get(lib.name) || lib.version;
          const installSpecifier = selectedVersion ? `${lib.name}@${selectedVersion}` : lib.name;

          try {
            const installed = await platformIOService.listInstalledLibraries();
            const alreadyInstalled = installed.some(existing => existing.name === lib.name);
            if (alreadyInstalled) {
              toast.info('既にインストール済み', `${lib.name} はすでにインストールされています`);
              return;
            }
          } catch (error) {
            logger.warning('Failed to check PlatformIO libraries', error instanceof Error ? error.message : String(error));
          }

          const success = await platformIOService.installLibrary(installSpecifier);
          if (success) {
            toast.success('ライブラリをインストール', `${lib.name} (${selectedVersion}) をインストールしました`);
          } else {
            toast.error('インストール失敗', `${lib.name} をインストールできませんでした`);
          }
        } else {
          toast.error('未対応のモードです');
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('Installation failed', errorMsg);
      toast.error('インストールエラー', errorMsg);
    } finally {
      setInstalling(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleVersionChange = (libraryName: string, version: string) => {
    setSelectedVersions(prev => {
      const next = new Map(prev);
      next.set(libraryName, version);
      return next;
    });
  };

  const isBoard = (item: Board | Library): item is Board => {
    return 'platform' in item;
  };

  return (
    <div className="board-library-manager">
      <div className="manager-header">
        <div className="header-top">
          <h3>{type === 'board' ? 'Board Manager' : 'Library Manager'}</h3>
          <div className="header-actions">
            <button 
              className="btn secondary"
              onClick={() => loadItems(true)}
              disabled={loading}
              title="Force refresh from server"
            >
              🔄 Re-index
            </button>
            <button 
              className="btn secondary"
              onClick={clearCache}
              title="Clear cached data"
            >
              🗑️ Clear Cache
            </button>
          </div>
        </div>
        
        <p>
          {type === 'board' 
            ? 'Essential development boards (cached for fast access)' 
            : 'Popular libraries and search results (cached for fast access)'}
        </p>
        
        {cacheInfo && (
          <div className="cache-info">
            <span className="cache-status">
              📦 Cached data from {cacheInfo.source} • 
              Last updated: {new Date(cacheInfo.lastUpdate).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <div className="search-controls">
        <form onSubmit={handleSearch} className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder={`Search ${type === 'board' ? 'boards' : 'libraries'}...`}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="search-btn" disabled={loading}>
            Search
          </button>
          <button 
            type="button"
            className="refresh-btn" 
            onClick={() => loadItems(true)}
            disabled={loading}
          >
            Refresh
          </button>
        </form>
      </div>

      <div className="items-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading {type === 'board' ? 'boards' : 'libraries'}...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            <p>No {type === 'board' ? 'boards' : 'libraries'} found</p>
            <p className="hint">Try adjusting your search or click Refresh</p>
          </div>
        ) : (
          <div className="items-grid">
            {filteredItems.map((item, index) => {
              const itemId = isBoard(item) ? item.id : item.name;
              const isInstalling = installing.has(itemId);
              const installLabel = isInstalling
                ? 'Installing...'
                : type === 'board'
                  ? mode === 'platformio'
                    ? 'Install Platform'
                    : 'Install Core'
                  : 'Install';

              return (
                <div key={itemId || index} className={`${type}-item`}>
                  <div className="item-header">
                    <h4 className="item-name">{item.name}</h4>
                    {isBoard(item) ? (
                      <span className="platform-badge">{item.platform}</span>
                    ) : (
                      <span className="version-badge">v{item.version}</span>
                    )}
                  </div>

                  {isBoard(item) ? (
                    <div className="board-meta">
                      {item.description && (
                        <p className="board-description">{item.description}</p>
                      )}
                      <div className="meta-item-group">
                        {item.maintainer && (
                          <div className="meta-item">
                            <span className="meta-label">Maintainer:</span>
                            <span className="meta-value">{item.maintainer}</span>
                          </div>
                        )}
                        {item.version && (
                          <div className="meta-item">
                            <span className="meta-label">Version:</span>
                            <span className="meta-value">{item.version}</span>
                          </div>
                        )}
                        {item.website && (
                          <div className="meta-item">
                            <span className="meta-label">Website:</span>
                            <a
                              href={item.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="meta-value"
                            >
                              {item.website}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="library-meta">
                      <p className="library-description">{item.description}</p>
                      {item.author && (
                        <div className="meta-item">
                          <span className="meta-label">Author:</span>
                          <span className="meta-value">{item.author}</span>
                        </div>
                      )}
                      {item.website && (
                        <div className="meta-item">
                          <span className="meta-label">Website:</span>
                          <a 
                            href={item.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="meta-value"
                          >
                            {item.website}
                          </a>
                        </div>
                      )}
                      <div className="meta-item version-selector">
                        <span className="meta-label">Version:</span>
                        <select
                          value={selectedVersions.get(item.name) || item.version}
                          onChange={(e) => handleVersionChange(item.name, e.target.value)}
                          disabled={isInstalling}
                        >
                          <option value={item.version}>{item.version} (latest)</option>
                          {item.availableVersions?.filter(v => v !== item.version).map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="item-actions">
                    <button
                      className="install-btn"
                      onClick={() => handleInstall(item)}
                      disabled={isInstalling}
                    >
                      {installLabel}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardLibraryManager;
