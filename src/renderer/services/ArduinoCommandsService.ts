// Arduino Commands Service for enhanced code completion with placeholders

export interface ArduinoCommand {
  command: string;
  template: string;
  description: string;
}

export interface CodeSnippet {
  label: string;
  insertText: string;
  detail: string;
  documentation: string;
  insertTextFormat: number; // 2 for snippet format
  parameters?: ParameterInfo[];
}

export interface ParameterInfo {
  name: string;
  hint: string;
  index: number;
}

export class ArduinoCommandsService {
  private commands: ArduinoCommand[] = [];
  
  constructor() {
    this.loadCommands();
  }

  private async loadCommands(): Promise<void> {
    try {
      // Load commands from commands.md (which is actually JSON)
      const commandsText = await window.electronAPI?.fs.readFile('e:/github/TIDE/commands.md');
      if (commandsText) {
        this.commands = JSON.parse(commandsText);
      }
    } catch (error) {
      console.error('Failed to load Arduino commands:', error);
      // Fallback to basic commands
      this.commands = this.getBasicCommands();
    }
  }

  private getBasicCommands(): ArduinoCommand[] {
    return [
      {
        command: 'pinMode',
        template: 'pinMode(pin, mode)',
        description: 'ピンのモードを設定 (INPUT, OUTPUT, INPUT_PULLUP)'
      },
      {
        command: 'digitalWrite',
        template: 'digitalWrite(pin, value)',
        description: 'デジタルピンに HIGH または LOW を出力する'
      },
      {
        command: 'digitalRead',
        template: 'digitalRead(pin)',
        description: 'デジタルピンの状態を読み取る (HIGH または LOW)'
      },
      {
        command: 'analogWrite',
        template: 'analogWrite(pin, value)',
        description: 'PWMピンにアナログ値（PWM波）を出力する (0 から 255)'
      },
      {
        command: 'analogRead',
        template: 'analogRead(pin)',
        description: 'アナログピンの値を読み取る (0 から 1023)'
      },
      {
        command: 'delay',
        template: 'delay(ms)',
        description: '指定した時間（ミリ秒）プログラムを一時停止する'
      }
    ];
  }

  public getCodeSnippets(query?: string): CodeSnippet[] {
    const filteredCommands = query 
      ? this.commands.filter(cmd => 
          cmd.command.toLowerCase().includes(query.toLowerCase())
        )
      : this.commands;

    return filteredCommands.map(cmd => this.convertToSnippet(cmd));
  }

  private convertToSnippet(cmd: ArduinoCommand): CodeSnippet {
    const { insertText, parameters } = this.parseTemplate(cmd.template);
    
    return {
      label: cmd.command,
      insertText,
      detail: cmd.template,
      documentation: cmd.description,
      insertTextFormat: 2, // Snippet format
      parameters
    };
  }

  private parseTemplate(template: string): { insertText: string; parameters: ParameterInfo[] } {
    const parameters: ParameterInfo[] = [];
    let paramIndex = 1;
    
    // Convert template like "pinMode(pin, mode)" to Monaco snippet format "pinMode(${1:pin}, ${2:mode})"
    let insertText = template;
    
    // Extract function name and parameters
    const match = template.match(/^(\w+)\((.*)\)$/);
    if (!match) {
      return { insertText: template, parameters };
    }
    
    const functionName = match[1];
    const paramsString = match[2];
    
    if (!paramsString.trim()) {
      // No parameters
      return { insertText: `${functionName}();`, parameters };
    }
    
    // Split parameters and create placeholders
    const paramNames = paramsString.split(',').map(p => p.trim());
    const snippetParams = paramNames.map((param, index) => {
      const hint = this.getParameterHint(functionName, param);
      parameters.push({
        name: param,
        hint,
        index: index + 1
      });
      return `\${${index + 1}:${param}}`;
    }).join(', ');
    
    insertText = `${functionName}(${snippetParams});`;
    
    return { insertText, parameters };
  }

  private getParameterHint(functionName: string, paramName: string): string {
    // Provide contextual hints for common parameters
    const hints: Record<string, Record<string, string>> = {
      'pinMode': {
        'pin': '0-13 (デジタルピン番号)',
        'mode': 'INPUT, OUTPUT, INPUT_PULLUP'
      },
      'digitalWrite': {
        'pin': '0-13 (デジタルピン番号)',
        'value': 'HIGH, LOW'
      },
      'digitalRead': {
        'pin': '0-13 (デジタルピン番号)'
      },
      'analogWrite': {
        'pin': '3,5,6,9,10,11 (PWMピン)',
        'value': '0-255 (PWM値)'
      },
      'analogRead': {
        'pin': 'A0-A5 (アナログピン)'
      },
      'delay': {
        'ms': 'ミリ秒 (1000 = 1秒)'
      },
      'map': {
        'value': '変換する値',
        'fromLow': '入力範囲の最小値',
        'fromHigh': '入力範囲の最大値',
        'toLow': '出力範囲の最小値',
        'toHigh': '出力範囲の最大値'
      }
    };

    return hints[functionName]?.[paramName] || paramName;
  }

  public getCommandByName(name: string): ArduinoCommand | undefined {
    return this.commands.find(cmd => cmd.command === name);
  }
}

// Singleton instance
export const arduinoCommandsService = new ArduinoCommandsService();