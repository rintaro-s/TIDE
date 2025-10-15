import React, { useState, useEffect } from 'react';
import './SearchPanel.css';

interface SearchResult {
  file: string;
  line: number;
  column: number;
  text: string;
  preview: string;
}

const SearchPanel: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isReplaceMode, setIsReplaceMode] = useState(false);
  const [matchCase, setMatchCase] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      // 実際の検索機能（実装予定）
      setSearchResults([]);
      console.log('Searching for:', searchQuery);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    }
  };

  const handleReplace = () => {
    console.log('Replace:', searchQuery, 'with:', replaceQuery);
  };

  const handleReplaceAll = () => {
    console.log('Replace all:', searchQuery, 'with:', replaceQuery);
  };

  const handleResultClick = (result: SearchResult) => {
    console.log('Navigate to:', result.file, result.line, result.column);
  };

  useEffect(() => {
    if (searchQuery) {
      const timeoutId = setTimeout(handleSearch, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, matchCase, useRegex, wholeWord]);

  return (
    <div className="search-panel">
      <div className="search-header">
        <div className="section-title">検索</div>
        <button 
          className="toggle-replace-btn"
          onClick={() => setIsReplaceMode(!isReplaceMode)}
          title="置換モード切り替え"
        >
          ↔
        </button>
      </div>

      <div className="search-form">
        <div className="search-input-group">
          <input
            type="text"
            placeholder="検索"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button className="search-btn" onClick={handleSearch}>
            Find
          </button>
        </div>

        {isReplaceMode && (
          <div className="replace-input-group">
            <input
              type="text"
              placeholder="置換"
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              className="replace-input"
            />
            <div className="replace-actions">
              <button className="replace-btn" onClick={handleReplace}>
                置換
              </button>
              <button className="replace-all-btn" onClick={handleReplaceAll}>
                全置換
              </button>
            </div>
          </div>
        )}

        <div className="search-options">
          <label className="option-label">
            <input
              type="checkbox"
              checked={matchCase}
              onChange={(e) => setMatchCase(e.target.checked)}
            />
            <span>大文字小文字を区別</span>
          </label>
          <label className="option-label">
            <input
              type="checkbox"
              checked={wholeWord}
              onChange={(e) => setWholeWord(e.target.checked)}
            />
            <span>単語全体</span>
          </label>
          <label className="option-label">
            <input
              type="checkbox"
              checked={useRegex}
              onChange={(e) => setUseRegex(e.target.checked)}
            />
            <span>正規表現</span>
          </label>
        </div>
      </div>

      <div className="search-results">
        <div className="results-header">
          {searchResults.length > 0 && (
            <span className="results-count">
              {searchResults.length} 件の結果
            </span>
          )}
        </div>

        <div className="results-list">
          {searchResults.map((result, index) => (
            <div 
              key={`${result.file}-${result.line}-${index}`}
              className="search-result"
              onClick={() => handleResultClick(result)}
            >
              <div className="result-location">
                <span className="file-name">{result.file}</span>
                <span className="line-number">:{result.line}:{result.column}</span>
              </div>
              <div className="result-preview">
                {result.preview}
              </div>
            </div>
          ))}
        </div>

        {searchQuery && searchResults.length === 0 && (
          <div className="no-results">
            検索結果が見つかりませんでした
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPanel;