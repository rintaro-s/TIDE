[
  {
    "command": "pinMode",
    "template": "pinMode(${1:pin}, ${2:mode});",
    "description": "Sets the specified digital pin to behave either as an input or an output. INPUT, OUTPUT, or INPUT_PULLUP.",
    "category": "Digital I/O",
    "parameters": ["pin", "mode"]
  },
  {
    "command": "digitalWrite",
    "template": "digitalWrite(${1:pin}, ${2:value});",
    "description": "Writes a HIGH or LOW value to a digital pin.",
    "category": "Digital I/O",
    "parameters": ["pin", "value"]
  },
  {
    "command": "digitalRead",
    "template": "digitalRead(${1:pin})",
    "description": "Reads the value from a specified digital pin, either HIGH or LOW.",
    "category": "Digital I/O",
    "parameters": ["pin"]
  },
  {
    "command": "analogRead",
    "template": "analogRead(${1:pin})",
    "description": "Reads the value from the specified analog pin. Arduino boards contain a multichannel, 10-bit analog to digital converter.",
    "category": "Analog I/O",
    "parameters": ["pin"]
  },
  {
    "command": "analogWrite",
    "template": "analogWrite(${1:pin}, ${2:value});",
    "description": "Writes an analog value (PWM wave) to a pin. Value from 0 to 255.",
    "category": "Analog I/O",
    "parameters": ["pin", "value"]
  },
  {
    "command": "delay",
    "template": "delay(${1:ms});",
    "description": "Pauses the program for the amount of time (in milliseconds) specified as parameter.",
    "category": "Time",
    "parameters": ["ms"]
  },
  {
    "command": "delayMicroseconds",
    "template": "delayMicroseconds(${1:us});",
    "description": "Pauses the program for the amount of time (in microseconds) specified as parameter.",
    "category": "Time",
    "parameters": ["us"]
  },
  {
    "command": "millis",
    "template": "millis()",
    "description": "Returns the number of milliseconds passed since the Arduino board began running the current program.",
    "category": "Time",
    "parameters": []
  },
  {
    "command": "micros",
    "template": "micros()",
    "description": "Returns the number of microseconds since the Arduino board began running the current program.",
    "category": "Time",
    "parameters": []
  },
  {
    "command": "Serial.begin",
    "template": "Serial.begin(${1:baudrate});",
    "description": "Sets the data rate in bits per second (baud) for serial data transmission.",
    "category": "Serial",
    "parameters": ["baudrate"]
  },
  {
    "command": "Serial.print",
    "template": "Serial.print(${1:value});",
    "description": "Prints data to the serial port as human-readable ASCII text.",
    "category": "Serial",
    "parameters": ["value"]
  },
  {
    "command": "Serial.println",
    "template": "Serial.println(${1:value});",
    "description": "Prints data to the serial port as human-readable ASCII text followed by a carriage return character (ASCII 13, or '\\r') and a newline character (ASCII 10, or '\\n').",
    "category": "Serial",
    "parameters": ["value"]
  },
  {
    "command": "Serial.available",
    "template": "Serial.available()",
    "description": "Get the number of bytes (characters) available for reading from the serial port.",
    "category": "Serial",
    "parameters": []
  },
  {
    "command": "Serial.read",
    "template": "Serial.read()",
    "description": "Reads incoming serial data.",
    "category": "Serial",
    "parameters": []
  },
  {
    "command": "map",
    "template": "map(${1:value}, ${2:fromLow}, ${3:fromHigh}, ${4:toLow}, ${5:toHigh})",
    "description": "Re-maps a number from one range to another.",
    "category": "Math",
    "parameters": ["value", "fromLow", "fromHigh", "toLow", "toHigh"]
  },
  {
    "command": "constrain",
    "template": "constrain(${1:amt}, ${2:low}, ${3:high})",
    "description": "Constrains a number to be within a range.",
    "category": "Math",
    "parameters": ["amt", "low", "high"]
  },
  {
    "command": "min",
    "template": "min(${1:x}, ${2:y})",
    "description": "Calculates the minimum of two numbers.",
    "category": "Math",
    "parameters": ["x", "y"]
  },
  {
    "command": "max",
    "template": "max(${1:x}, ${2:y})",
    "description": "Calculates the maximum of two numbers.",
    "category": "Math",
    "parameters": ["x", "y"]
  },
  {
    "command": "abs",
    "template": "abs(${1:x})",
    "description": "Computes the absolute value of a number.",
    "category": "Math",
    "parameters": ["x"]
  },
  {
    "command": "pow",
    "template": "pow(${1:base}, ${2:exponent})",
    "description": "Calculates the value of a number raised to a power.",
    "category": "Math",
    "parameters": ["base", "exponent"]
  },
  {
    "command": "sqrt",
    "template": "sqrt(${1:x})",
    "description": "Calculates the square root of a number.",
    "category": "Math",
    "parameters": ["x"]
  },
  {
    "command": "sin",
    "template": "sin(${1:rad})",
    "description": "Calculates the sine of an angle (in radians).",
    "category": "Trigonometry",
    "parameters": ["rad"]
  },
  {
    "command": "cos",
    "template": "cos(${1:rad})",
    "description": "Calculates the cosine of an angle (in radians).",
    "category": "Trigonometry",
    "parameters": ["rad"]
  },
  {
    "command": "tan",
    "template": "tan(${1:rad})",
    "description": "Calculates the tangent of an angle (in radians).",
    "category": "Trigonometry",
    "parameters": ["rad"]
  },
  {
    "command": "random",
    "template": "random(${1:max})",
    "description": "Generates pseudo-random numbers. Returns a random number between 0 and max-1.",
    "category": "Random",
    "parameters": ["max"]
  },
  {
    "command": "randomSeed",
    "template": "randomSeed(${1:seed});",
    "description": "Initializes the pseudo-random number generator.",
    "category": "Random",
    "parameters": ["seed"]
  },
  {
    "command": "attachInterrupt",
    "template": "attachInterrupt(digitalPinToInterrupt(${1:pin}), ${2:ISR}, ${3:mode});",
    "description": "Digital Pins With Interrupts. Specifies a named Interrupt Service Routine (ISR) to call when an interrupt occurs.",
    "category": "Interrupts",
    "parameters": ["pin", "ISR", "mode"]
  },
  {
    "command": "detachInterrupt",
    "template": "detachInterrupt(digitalPinToInterrupt(${1:pin}));",
    "description": "Turns off the given interrupt.",
    "category": "Interrupts",
    "parameters": ["pin"]
  },
  {
    "command": "tone",
    "template": "tone(${1:pin}, ${2:frequency});",
    "description": "Generates a square wave of the specified frequency (and 50% duty cycle) on a pin.",
    "category": "Advanced I/O",
    "parameters": ["pin", "frequency"]
  },
  {
    "command": "noTone",
    "template": "noTone(${1:pin});",
    "description": "Stops the generation of a square wave triggered by tone().",
    "category": "Advanced I/O",
    "parameters": ["pin"]
  },
  {
    "command": "pulseIn",
    "template": "pulseIn(${1:pin}, ${2:value})",
    "description": "Reads a pulse (either HIGH or LOW) on a pin.",
    "category": "Advanced I/O",
    "parameters": ["pin", "value"]
  },
  {
    "command": "shiftOut",
    "template": "shiftOut(${1:dataPin}, ${2:clockPin}, ${3:bitOrder}, ${4:value});",
    "description": "Shifts out a byte of data one bit at a time.",
    "category": "Advanced I/O",
    "parameters": ["dataPin", "clockPin", "bitOrder", "value"]
  },
  {
    "command": "shiftIn",
    "template": "shiftIn(${1:dataPin}, ${2:clockPin}, ${3:bitOrder})",
    "description": "Shifts in a byte of data one bit at a time.",
    "category": "Advanced I/O",
    "parameters": ["dataPin", "clockPin", "bitOrder"]
  },
  {
    "command": "setup",
    "template": "void setup() {\n  ${1:// initialization code here}\n}",
    "description": "The setup() function is called when a sketch starts. Use it to initialize variables, pin modes, start using libraries, etc.",
    "category": "Structure",
    "parameters": []
  },
  {
    "command": "loop",
    "template": "void loop() {\n  ${1:// main code here}\n}",
    "description": "After creating a setup() function, which initializes and sets the initial values, the loop() function does precisely what its name suggests, and loops consecutively.",
    "category": "Structure",
    "parameters": []
  },
  {
    "command": "if",
    "template": "if (${1:condition}) {\n  ${2:// code}\n}",
    "description": "Tests whether a certain condition has been reached, such as an input being above a certain number.",
    "category": "Control Structure",
    "parameters": ["condition"]
  },
  {
    "command": "for",
    "template": "for (${1:initialization}; ${2:condition}; ${3:increment}) {\n  ${4:// code}\n}",
    "description": "The for statement is used to repeat a block of statements enclosed in curly braces.",
    "category": "Control Structure",
    "parameters": ["initialization", "condition", "increment"]
  },
  {
    "command": "while",
    "template": "while (${1:condition}) {\n  ${2:// code}\n}",
    "description": "A while loop will loop continuously, and infinitely, until the expression inside the parenthesis, () becomes false.",
    "category": "Control Structure",
    "parameters": ["condition"]
  },
  {
    "command": "switch",
    "template": "switch (${1:var}) {\n  case ${2:1}:\n    ${3:// code}\n    break;\n  default:\n    ${4:// code}\n    break;\n}",
    "description": "Like if statements, switch case controls the flow of programs by allowing programmers to specify different code that should be executed in various conditions.",
    "category": "Control Structure",
    "parameters": ["var"]
  }
]