/**
 * @file Mylang grammar for tree-sitter
 * @author davidevofficial <davidevufficial@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: 'mylang',
  extras: ($) => [$.comment, $._whitespace_char],
  conflicts: () => [],
  inline: ($) => [
      $.namespace,
      $.variable_in_parens,
  ],
  rules: {
      mylang: ($) => seq($.statement, optional(';')),
      statement: ($) => $.query,
      query: $ => choice($.regular_query, $.standalone_call),
      regular_query: ($) => seq($.single_query, repeat($.union)),
      union: ($) => seq(word('union'), optional(word('all')), $.single_query),
      single_query: ($) => choice($.single_part_query, $.multi_part_query),
      single_part_query: ($) => choice(seq(repeat($.reading_clause), $.return), seq(repeat($.reading_clause), repeat1($.updating_clause), optional($.return))),
      multi_part_query: ($) => seq(repeat1(seq(repeat($.reading_clause), repeat($.updating_clause), $.with)), $.single_part_query),
      updating_clause: ($) => choice($.create, $.merge, $.delete, $.set, $.remove),
      reading_clause: ($) => choice($.match, $.unwind, $.in_query_call),
      match: ($) => seq(optional(word('optional')), word('match'), $.pattern, optional($.where)),
      unwind: ($) => seq(word('unwind'), $.expression, word('as'), $.variable),
      merge: ($) => seq(word('merge'), $.pattern_part, repeat($.merge_action)),
      merge_action: ($) => seq(word('on'), choice(word('create'), word('match')), $.set),
      create: ($) => seq(word('create'), $.pattern),
      set: ($) => seq(word('set'), $.set_item, repeat(seq(',', $.set_item))),
      set_item: ($) => choice(seq($.property_expression, '=', $.expression), seq($.variable, choice('+=', '='), $.expression), seq($.variable, $.node_labels)),
      delete: ($) => seq(optional(word('detach')), word('delete'), $.expression, repeat(seq(',', $.expression))),
      remove: ($) => seq(word('remove'), $.remove_item, repeat(seq(',', $.remove_item))),
      remove_item: ($) => choice(seq($.variable, $.node_labels), $.property_expression),
      in_query_call: ($) => seq(word('call'), $.explicit_procedure_invocation, optional(seq(word('yield'), $.yield_items))),
      standalone_call: ($) => seq(word('call'), choice($.explicit_procedure_invocation, $.implicit_procedure_invocation), optional(seq(word('yield'), $.yield_items))),
      yield_items: ($) => seq(choice('*', seq($.yield_item, repeat(seq(',', $.yield_item)))), optional($.where)),
      yield_item: ($) => seq(optional(seq($.procedure_result_field, word('as'))), $.variable),
      with: ($) => seq(word('with'), $.projection_body, optional($.where)),
      return: ($) => seq(word('return'), $.projection_body),
      projection_body: ($) => seq(optional(word('distinct')), $.projection_items, optional($.order), optional($.skip), optional($.limit)),
      projection_items: ($) => choice(seq('*', repeat(seq(',', $.projection_item))), seq($.projection_item, repeat(seq(',', $.projection_item)))),
      projection_item: ($) => choice($.expression, seq($.expression, word('as'), $.variable)),
      order: ($) => seq(word('order'), word('by'), $.sort_item, repeat(seq(',', $.sort_item))),
      skip: ($) => seq(word('skip'), $.expression),
      limit: ($) => seq(word('limit'), $.expression),
      sort_item: ($) => seq($.expression, optional(choice(word('asc'), word('ascending'), word('desc'), word('descending')))),
      where: ($) => seq(word('where'), $.expression),
      pattern: ($) => seq($.pattern_part, repeat(seq(',', $.pattern_part))),
      pattern_part: ($) => choice(seq($.variable, '=', $.anonymous_pattern_part), $.anonymous_pattern_part),
      anonymous_pattern_part: ($) => $.pattern_element,
      pattern_element: ($) => choice(seq($.node_pattern, repeat($.pattern_element_chain)), seq('(', $.pattern_element, ')')),
      /*
       * Rule that was extracted from common pattern on `note_pattern` and `parenthesized_expression`.
       * Both of them could be expressed as `(variable)` what caused the tree to be generated in
       * favour of one of those rules.
       * In short: I couldn't find a way to fix the problem without this "artificial" rule.
       */
      variable_in_parens: ($) => seq('(', $.variable, ')'),
      // TODO: verify whether the precedence higher than `parenthesized_expression` is correct.
      node_pattern: ($) => prec(1, choice($.variable_in_parens, seq('(', optional($.variable), optional($.node_labels), optional($.properties), ')'))),
      pattern_element_chain: ($) => seq($.relationship_pattern, $.node_pattern),
      relationship_pattern: ($) => seq(optional($.left_arrow_head), $.dash, optional($.relationship_detail), $.dash, optional($.right_arrow_head)),
      relationship_detail: ($) => seq('[', optional($.variable), optional($.relationship_types), optional($.range_literal), optional($.properties), ']'),
      // TODO: ensure that the precedence here does not break grammar.
      properties: ($) => prec(1, choice($.map_literal, $.parameter)),
      relationship_types: ($) => seq(':', $.rel_type_name, repeat(seq('|', optional(':'), $.rel_type_name))),
      node_labels: ($) => prec.right(repeat1($.node_label)),
      node_label: ($) => seq(':', $.label_name),
      range_literal: ($) => seq('*', optional($.integer_literal), optional(seq('..', optional($.integer_literal)))),
      label_name: ($) => $.schema_name,
      rel_type_name: ($) => $.schema_name,
      expression: ($) => choice($.or_expression, $.xor_expression, $.and_expression, $.not_expression, $.comparison_expression, $.string_list_null_predicate_expression, $.additive_expression, $.multiplicative_expression, $.exponential_expression, $.unary_expression, $.list_operator_expression, $.property_or_labels_expression, $.atom),
      or_expression: ($) => prec.left(1, seq($.expression, word('or'), $.expression)),
      xor_expression: ($) => prec.left(2, seq($.expression, word('xor'), $.expression)),
      and_expression: ($) => prec.left(3, seq($.expression, word('and'), $.expression)),
      not_expression: ($) => prec(4, seq(word('not'), $.expression)),
      comparison_expression: ($) => prec.left(5, seq($.expression, seq(choice('=', '<>', '<', '>', '<=', '>='), $.expression))),
      string_list_null_predicate_expression: ($) => prec(6, seq($.expression, choice($.list_predicate_expression, $.string_predicate_expression, $.null_predicate_expression))),
      list_predicate_expression: ($) => prec.left(6, seq(word('in'), $.expression)),
      string_predicate_expression: ($) => prec.left(6, seq(choice(seq(word('starts'), word('with')), seq(word('ends'), word('with')), seq(word('contains'))), $.expression)),
      null_predicate_expression: ($) => prec(6, seq(word('is'), optional(word('not')), word('null'))),
      additive_expression: ($) => prec.left(7, seq($.expression, choice('-', '+'), $.expression)),
      multiplicative_expression: ($) => prec.left(8, seq($.expression, choice('*', '/', '%'), $.expression)),
      exponential_expression: ($) => prec.left(9, seq($.expression, '^', $.expression)),
      unary_expression: ($) => prec(10, seq(choice('+', '-'), $.expression)),
      list_operator_expression: ($) => prec(11, seq($.expression, choice(seq('[', $.expression, ']'), seq('[', optional($.expression), '..', optional($.expression), ']')))),
      property_or_labels_expression: ($) => prec.right(11, seq($.expression, choice(seq(repeat1($.property_lookup), optional($.node_labels)), seq(repeat($.property_lookup), $.node_labels)))),
      atom: ($) => choice($.literal, $.parameter, $.case_expression, seq(word('count'), /\(\s*\*\s*\)/), $.list_comprehension, $.pattern_comprehension, $.quantifier, $.pattern_predicate, $.parenthesized_expression, $.function_invocation, $.existential_subquery, prec.left($.variable)),
      literal: ($) => choice($.number_literal, $.string_literal, $.boolean_literal, $.null_literal, $.map_literal, $.list_literal),
      null_literal: () => word('null'),
      boolean_literal: () => choice(word('true'), word('false')),
      list_literal: ($) => seq('[', optional(seq($.expression, repeat(seq(',', $.expression)))), ']'),
      parenthesized_expression: ($) => choice($.variable_in_parens, seq('(', $.expression, ')')),
      relationships_pattern: ($) => seq($.node_pattern, prec.right(repeat1($.pattern_element_chain))),
      pattern_predicate: ($) => $.relationships_pattern,
      filter_expression: ($) => seq($.id_in_coll, optional($.where)),
      id_in_coll: ($) => prec(1, seq($.variable, word('in'), $.expression)),
      function_invocation: ($) => seq($.function_name, '(', optional(word('distinct')), optional(seq($.expression, repeat(seq(',', $.expression)))), ')'),
      function_name: ($) => seq(optional($.namespace), $.symbolic_name),
      existential_subquery: ($) => seq(word('exists'), '{', choice($.regular_query, seq($.pattern, optional($.where))), '}'),
      explicit_procedure_invocation: ($) => seq($.procedure_name, '(', optional(seq($.expression, repeat(seq(',', $.expression)))), ')'),
      implicit_procedure_invocation: ($) => $.procedure_name,
      procedure_result_field: ($) => $.symbolic_name,
      procedure_name: ($) => seq(optional($.namespace), $.symbolic_name),
      namespace: ($) => repeat1(seq($.variable, '.')),
      list_comprehension: ($) => seq('[', $.filter_expression, optional(seq('|', $.expression)), ']'),
      pattern_comprehension: ($) => prec(11, seq('[', optional(seq($.variable, '=')), $.relationships_pattern, optional(seq(word('where'), $.expression)), '|', $.expression, ']')),
      quantifier: ($) => prec(12, choice(seq(word('all'), '(', $.filter_expression, ')'), seq(word('any'), '(', $.filter_expression, ')'), seq(word('none'), '(', $.filter_expression, ')'), seq(word('single'), '(', $.filter_expression, ')'))),
      property_lookup: ($) => seq('.', $.property_key_name),
      case_expression: ($) => seq(choice(seq(word('case'), repeat($.case_alternatives)), seq(word('case'), $.expression, repeat($.case_alternatives))), optional(seq(word('else'), $.expression)), word('end')),
      case_alternatives: ($) => seq(word('when'), $.expression, word('then'), $.expression),
      variable: ($) => $.symbolic_name,
      string_literal: ($) => choice(seq(`'`, repeat(choice(/[^'\\]+/, $.escaped_char)), `'`), seq(`"`, repeat(choice(/[^"\\]+/, $.escaped_char)), `"`)),
      escaped_char: () => token(seq('\\', choice('\\', `"`, `'`, /[^uU]/, /[u][a-fA-F0-9]{4}/, /[U][a-fA-F0-9]{8}/))),
      number_literal: ($) => choice($.double_literal, $.integer_literal),
      map_literal: ($) => seq('{', optional(seq($.property_key_name, ':', $.expression, repeat(seq(',', $.property_key_name, ':', $.expression)))), '}'),
      parameter: ($) => seq('$', choice($.symbolic_name, $.decimal_integer)),
      property_expression: ($) => seq($.atom, repeat($.property_lookup)),
      property_key_name: ($) => $.schema_name,
      integer_literal: ($) => choice($.hex_integer, $.octal_integer, $.decimal_integer),
      hex_integer: () => /0x[0-9a-f]+/i,
      decimal_integer: () => choice('0', /[1-9][0-9]*/),
      octal_integer: () => /0o[0-7]+/,
      double_literal: ($) => choice($.exponent_decimal_real, $.regular_decimal_real),
      exponent_decimal_real: () => token(seq(choice(/[0-9]+/, seq(/[0-9]+/, '.', /[0-9]+/), seq('.', /[0-9]+/)), word('e'), optional('-'), /[0-9]+/)),
      regular_decimal_real: () => /[0-9]*\.[0-9]+/,
      schema_name: ($) => choice($.symbolic_name, $.reserved_word),
      reserved_word: () => choice(word('all'), word('asc'), word('ascending'), word('by'), word('create'), word('delete'), word('desc'), word('descending'), word('detach'), word('exists'), word('limit'), word('match'), word('merge'), word('on'), word('optional'), word('order'), word('remove'), word('return'), word('set'), word('skip'), word('where'), word('with'), word('union'), word('unwind'), word('and'), word('as'), word('contains'), word('distinct'), word('ends'), word('in'), word('is'), word('not'), word('or'), word('starts'), word('xor'), word('false'), word('true'), word('null'), word('constraint'), word('unique'), word('case'), word('when'), word('then'), word('else'), word('end'), word('mandatory'), word('scalar'), word('of'), word('add'), word('drop')),
      symbolic_name: ($) => prec.left(choice($.unescaped_symbolic_name, $.escaped_symbolic_name, word('count'), word('filter'), word('extract'), word('any'), word('none'), word('single'))),
      unescaped_symbolic_name: ($) => (/(\p{ID_Start}|\p{Pc})(\p{ID_Continue}|\p{Sc})*/u),
      escaped_symbolic_name: () => repeat1(/`[^`]*`/),
      comment: ($) => choice(seq('/*', repeat(choice(/[^\*]/, /\*[^\/]/)), '*/'), seq('//', /.*/, '\n')),
      left_arrow_head: () => choice('<', '\u{27e8}', '\u{3008}', '\u{fe64}', '\u{ff1c}'),
      right_arrow_head: () => choice('>', '\u{27e9}', '\u{3009}', '\u{fe65}', '\u{ff1e}'),
      dash: () => choice('-', '\u{00ad}', '\u{2010}', '\u{2011}', '\u{2012}', '\u{2013}', '\u{2014}', '\u{2015}', '\u{2212}', '\u{fe58}', '\u{fe63}', '\u{ff0d}'),
      _whitespace_char: ($) => token(choice('\u{0009}', '\u{000a}', '\u{000b}', '\u{000c}', '\u{000d}', '\u{001c}', '\u{001d}', '\u{001e}', '\u{001f}', '\u{0020}', '\u{1680}', '\u{180e}', '\u{2000}', '\u{2001}', '\u{2002}', '\u{2003}', '\u{2004}', '\u{2005}', '\u{2006}', '\u{2008}', '\u{2009}', '\u{200a}', '\u{2028}', '\u{2029}', '\u{205f}', '\u{3000}', '\u{00a0}', '\u{2007}', '\u{202f}')),
  },
});
// TODO: Add tests and use this function.
function comma_separated(rule) {
  return seq(rule, repeat(seq(',', rule)));
}
function word(keyword) {
  return alias(token(seq(...keyword
      .split('')
      .map((char) => choice(char.toLowerCase(), char.toUpperCase())))), keyword);
}
