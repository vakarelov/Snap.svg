#!/usr/bin/env python3
"""
Convert prototype methods to ES6 class methods.
This script converts JavaScript prototype method assignments to ES6 class methods.
"""

import re
import sys

def convert_prototype_to_class_method(content):
    """
    Convert elproto.methodName = function(...) {...} 
    to 
    methodName(...) {...}
    """
    
    # Pattern 1: elproto.method = function(args) { ... }
    # This pattern needs to extract the method body and convert it
    pattern1 = r'(\s+)(elproto|Element\.prototype|Paper\.prototype|Fragment\.prototype)\.(\w+)\s*=\s*function\s*\((.*?)\)\s*\{'
    
    def replace_method(match):
        indent = match.group(1)
        method_name = match.group(3)
        params = match.group(4)
        return f'{indent}{method_name}({params}) {{'
    
    content = re.sub(pattern1, replace_method, content)
    
    # Pattern 2: Handle method aliases like elproto.css = elproto.attr;
    # These need to stay as assignments after the class
    
    return content

def extract_class_structure(content):
    """
    Extract the class definition and separate prototype methods
    """
    # Find the class definition
    class_match = re.search(r'(class\s+\w+\s*\{[^}]*constructor[^}]*\})', content, re.DOTALL)
    
    if not class_match:
        return None, None, None
        
    class_def = class_match.group(1)
    before_class = content[:class_match.start()]
    after_class = content[class_match.end():]
    
    return before_class, class_def, after_class

def main():
    if len(sys.argv) < 2:
        print("Usage: convert-prototype.py <file>")
        sys.exit(1)
    
    filename = sys.argv[1]
    
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Convert prototype methods
    converted = convert_prototype_to_class_method(content)
    
    # Write back
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(converted)
    
    print(f"Converted {filename}")

if __name__ == '__main__':
    main()
