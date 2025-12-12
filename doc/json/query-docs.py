#!/usr/bin/env python3
"""
JSDoc JSON Documentation Query Tool
Python version for querying Snap.svg documentation

Usage:
    python query-docs.py --class Element
    python query-docs.py --method animate --class Element
    python query-docs.py --search animate
"""

import json
import argparse
import sys
from pathlib import Path


class DocQuery:
    def __init__(self, doc_file='documentation.json'):
        """Load the documentation JSON file"""
        doc_path = Path(__file__).parent / doc_file
        with open(doc_path, 'r', encoding='utf-8') as f:
            self.docs = json.load(f)

    def find_class(self, class_name):
        """Find a class by name"""
        for item in self.docs:
            if item.get('kind') == 'class' and \
               (item.get('name') == class_name or item.get('longname') == class_name):
                return item
        return None

    def find_class_methods(self, class_name):
        """Find all methods of a class"""
        methods = []
        for item in self.docs:
            if item.get('kind') == 'function' and item.get('memberof') == class_name:
                methods.append(item)
        return methods

    def search_by_name(self, pattern):
        """Search for items by name pattern (case-insensitive)"""
        pattern_lower = pattern.lower()
        results = []
        for item in self.docs:
            name = item.get('name', '')
            longname = item.get('longname', '')
            if pattern_lower in name.lower() or pattern_lower in longname.lower():
                results.append(item)
        return results

    def get_all_classes(self):
        """Get all documented classes"""
        return [item for item in self.docs if item.get('kind') == 'class']

    def get_all_functions(self):
        """Get all functions/methods"""
        return [item for item in self.docs if item.get('kind') == 'function']

    def get_comment(self, doc_item):
        """Get the description/comment for a documentation item"""
        return doc_item.get('description') or doc_item.get('comment') or 'No documentation available'

    def print_item(self, item, verbose=False):
        """Pretty print a documentation item"""
        name = item.get('name', 'Unknown')
        kind = item.get('kind', 'unknown')
        longname = item.get('longname', name)

        print(f"\n{'='*60}")
        print(f"Name: {name}")
        print(f"Full Name: {longname}")
        print(f"Kind: {kind}")

        if item.get('memberof'):
            print(f"Member of: {item['memberof']}")

        if verbose:
            description = self.get_comment(item)
            print(f"\nDescription:\n{description[:200]}...")

            if item.get('params'):
                print(f"\nParameters:")
                for param in item['params']:
                    param_name = param.get('name', 'unknown')
                    param_type = param.get('type', {}).get('names', ['unknown'])
                    param_desc = param.get('description', '')
                    print(f"  - {param_name} ({', '.join(param_type)}): {param_desc}")

            if item.get('returns'):
                print(f"\nReturns:")
                for ret in item['returns']:
                    ret_type = ret.get('type', {}).get('names', ['unknown'])
                    ret_desc = ret.get('description', '')
                    print(f"  - ({', '.join(ret_type)}): {ret_desc}")

            if item.get('meta'):
                meta = item['meta']
                print(f"\nSource: {meta.get('filename')}:{meta.get('lineno')}")


def main():
    parser = argparse.ArgumentParser(description='Query JSDoc JSON documentation')
    parser.add_argument('--class', dest='class_name', help='Find a specific class')
    parser.add_argument('--method', dest='method_name', help='Find a specific method (use with --class)')
    parser.add_argument('--search', help='Search for items by name pattern')
    parser.add_argument('--list-classes', action='store_true', help='List all classes')
    parser.add_argument('--list-methods', action='store_true', help='List all methods of a class (use with --class)')
    parser.add_argument('-v', '--verbose', action='store_true', help='Show detailed information')

    args = parser.parse_args()

    # Load documentation
    try:
        query = DocQuery()
    except FileNotFoundError:
        print("Error: documentation.json not found. Run 'grunt docs:json' first.", file=sys.stderr)
        sys.exit(1)

    # Process commands
    if args.class_name:
        cls = query.find_class(args.class_name)
        if cls:
            query.print_item(cls, args.verbose)

            if args.list_methods:
                methods = query.find_class_methods(args.class_name)
                print(f"\n\nMethods of {args.class_name} ({len(methods)} total):")
                for method in methods[:20]:  # Show first 20
                    print(f"  - {method.get('name')}()")
                if len(methods) > 20:
                    print(f"  ... and {len(methods) - 20} more")

            if args.method_name:
                methods = query.find_class_methods(args.class_name)
                method = next((m for m in methods if m.get('name') == args.method_name), None)
                if method:
                    print(f"\n\nMethod Details:")
                    query.print_item(method, verbose=True)
                else:
                    print(f"\nMethod '{args.method_name}' not found in class '{args.class_name}'")
        else:
            print(f"Class '{args.class_name}' not found")

    elif args.search:
        results = query.search_by_name(args.search)
        print(f"Found {len(results)} items matching '{args.search}':")
        for item in results[:20]:  # Show first 20
            query.print_item(item, args.verbose)
        if len(results) > 20:
            print(f"\n... and {len(results) - 20} more results")

    elif args.list_classes:
        classes = query.get_all_classes()
        print(f"All Classes ({len(classes)} total):")
        for cls in classes:
            print(f"  - {cls.get('name', 'Unknown')} ({cls.get('longname', '')})")

    else:
        parser.print_help()
        print("\n\nExamples:")
        print("  python query-docs.py --class Element -v")
        print("  python query-docs.py --class Element --method animate")
        print("  python query-docs.py --class Element --list-methods")
        print("  python query-docs.py --search animate -v")
        print("  python query-docs.py --list-classes")


if __name__ == '__main__':
    main()

