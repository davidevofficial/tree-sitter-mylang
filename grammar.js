/**
 * @file Mylang grammar for tree-sitter
 * @author davidevofficial <davidevufficial@gmail.com>
 * @license none
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "mylang",

  rules: {
    // TODO: add the actual grammar rules
    source_file: $ => "hello"
  }
});
