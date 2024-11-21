# Dafny tree-sitter grammar

My attempt at creating a tree-sitter grammar for the Dafny programming language. The grammar is currently incomplete. A warning: this is my first time making a grammar for tree-sitter, and Dafny is also quite new to me.

The grammar is based on the grammar defined here: https://dafny.org/dafny/DafnyRef/DafnyRef.html, the biggest difference being the structure of expressions having been changed to use the tree-sitter precedence functions instead of layered precedence.
