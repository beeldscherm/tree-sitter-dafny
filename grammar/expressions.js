
module.exports = {
    // Expressions,

    // Top-level expression
    _expression: $ => choice(
        $.parens_expression,
        $.binary_expression,
        $.unary_expression,

        $.primary_expression
    ),

    // Parenthesized Expression
    parens_expression: $ => seq(
        '(',
        $._expression,
        ')'
    ),

    // Binary expression
    binary_expression: $ => choice(
        ...[
            // Dafny binary operators
            ['<==>', 'equivalence'],
            ['==>', 'implication'],
            ['<==', 'explication'],
            ['&&', 'logic_and'],
            ['||', 'logic_or'],
            ['==', 'binary_equality'],
            ['!=', 'binary_equality'],
            [' <', 'binary_relation'], // After extended annoyances with "generic instantiation", I have decided to use this hacky way of seperating it from this operator
            ['<=', 'binary_relation'],
            ['>=', 'binary_relation'],
            ['>', 'binary_relation'],
            ['in', 'membership'],
            ['!in', 'membership'],
            ['!!', 'disjointness'],
            ['<<', 'binary_shift'],
            ['>>', 'binary_shift'],
            ['+', 'binary_plus'],
            ['-', 'binary_plus'],
            ['*', 'binary_times'],
            ['/', 'binary_times'],
            ['%', 'binary_times'],
            ['|', 'bitwise_or'],
            ['&', 'bitwise_and'],
            ['^', 'bitwise_xor'],
            ['as', 'type_conversion'],
            ['is', 'type_test'],
        ].map(([operator, precedence]) =>
            prec.left(precedence, seq(
                // Because '&&' <expr> '&&' ... is allowed
                field('left', (operator == '&&' || operator == '||') ? seq(optional(choice('&&', '||')), $._expression) : $._expression),
                // '==' and '!=' have some weird stuff going on
                field('operator', (operator == '==' || operator == '!=') ? seq(operator, optional(seq('#', '[', $._expression, ']'))) : operator),
                field('right', $._expression),
            )),
        ),
    ),

    // Unary expression
    unary_expression: $ => prec('unary_expression', seq(
        field('operator', choice('-', '!')),
        field('argument', $._expression),
    )),
    
    // Primary expression
    primary_expression: $ => prec('primary_expression', choice(
        seq($._name_segment, repeat($.suffix)),
        $.lambda_expression,
        seq($.map_display_expr, repeat($.suffix)),
        seq($.seq_display_expr, repeat($.suffix)),
        seq($.set_display_expr, repeat($.suffix)),
        $.endless_expression, // This thing is creating some issues
        seq($.const_atom_expression, repeat($.suffix))
    )),
    
    // Lambda expression
    lambda_expression: $ => prec('primary_expression', seq(
        choice(
            $.wild_ident,
            seq(
                '(',
                optional($.ident_type_optional),
                repeat(
                    seq(',', $.ident_type_optional)
                ),
                ')'
            )
        ),
        optional($.lambda_spec),
        '=>',
        $._expression
    )),
    
    // Left-hand-side expression
    _lhs: $ => choice(
        seq($._name_segment, repeat($.suffix)),
        seq($.const_atom_expression, $.suffix, repeat($.suffix))
    ),
    
    // Right-hand-side expression
    _rhs: $ => seq(
        choice(
            $.array_allocation,
            $.object_allocation,
            $._expression,
            $.havoc_rhs
        ),
        repeat($.attribute)
    ),
    
    // Array allocation right-hand-side expression
    array_allocation: $ => seq(
        'new',
        optional($.type),
        '[',
        optional($.expressions),
        ']',
        optional(
            choice(
                seq('(', $._expression, ')'),
                seq(
                    '[',
                    optional($.expressions),
                    ']'
                )
            )
        )
    ),
    
    // Object allocation right-hand-side expression
    object_allocation: $ => seq(
        'new',
        $.type,
        optional(seq(
            '.',
            $.typename_or_ctorsuffix
        )),
        optional(seq(
            '(',
            $.bindings,
            ')'
        ))
    ),

    havoc_rhs: $ => '*',
    
    // Atomic expressions
    const_atom_expression: $ => choice(
        $.literal_expression,
        $.this_expression,
        $.fresh_expression,
        $.allocated_expression,
        $.unchanged_expression,
        $.old_expression,
        $.cardinality_expression,
    ),
    
    // Literal expressions
    literal_expression: $ => choice(
        'false',
        'true',
        'null',
        $.nat,
        $.dec,
        $.char_token,
        $.string_token
    ),

    nat: $ => choice($.digits, $.hexdigits),

    dec: $ => $.decimaldigits,
    
    // This expression
    this_expression: $ => 'this',
    
    // Old and Old@ Expressions
    old_expression: $ => seq(
        'old',
        optional(seq('@', $.label_name)),
        '(',
        $._expression,
        ')'
    ),
    
    // Fresh Expressions
    fresh_expression: $ => seq(
        'fresh',
        optional(seq('@', $.label_name)),
        '(',
        $._expression,
        ')'
    ),
    
    // Allocated Expressions
    allocated_expression: $ => seq(
        'allocated',
        '(',
        $._expression,
        ')'
    ),
    
    // Unchanged Expressions
    unchanged_expression: $ => seq(
        'fresh',
        optional(seq('@', $.label_name)),
        '(',
        $.frame_expression,
        repeat(
            seq(',', $.frame_expression)
        ),
        ')'
    ),
    
    // Cardinality Expressions
    cardinality_expression: $ => seq(
        '|',
        $._expression,
        '|'
    ),
    
    // Sequence Display Expression
    seq_display_expr: $ => choice(
        seq(
            '[',
            optional($._expression),
            ']'
        ),
        seq(
            'seq',
            optional($.generic_instantiation),
            '(',
            $._expression,
            ',',
            $._expression,
            ')'
        )
    ),
    
    // Set Display Expression
    set_display_expr: $ => choice(
        seq(
            optional(
                choice('iset', 'multiset')
            ),
            '{',
            optional($.expressions),
            '}'
        ),
        seq(
            'multiset',
            '(',
            $._expression,
            ')'
        )
    ),
    
    // Map Display Expression
    map_display_expr: $ => seq(
        choice('map', 'imap'),
        '[',
        optional($.map_literal_expressions),
        ']'
    ),

    map_literal_expressions: $ => seq(
        $._expression,
        ':=',
        $._expression,
        repeat(
            seq(
                ',',
                $._expression,
                ':=',
                $._expression
            )
        )
    ),
    
    // Endless Expression
    // I need to figure out how to check for these more efficiently,
    // since currently they each increase the compilation time significantly.
    endless_expression: $ => prec.left(choice( // Validate
        $.if_expression,
        // $.match_expression, // +2sec (?!)
        $.quantifier_expression,
        // $.set_comprehension_expr, // +2sec (?!)
        // seq($.stmt_in_expr, $._expression),
        $.let_expression,
        // $.map_comprehension_expr // +2sec (?!)
    )),
    
    // If expression
    if_expression: $ => prec.left(seq( // Validate
        'if',
        choice(
            $.binding_guard,
            $._expression
        ),
        'then',
        $._expression,
        'else',
        $._expression
    )),
    
    // Match Expression
    match_expression: $ => prec.left(seq(
        'match',
        $._expression,
        choice(
            seq(
                '{',
                repeat($.case_expression),
                '}'
            ),
            repeat($.case_expression)
        )
    )),

    case_expression: $ => prec.left(seq( // Verify
        'case',
        repeat($.attribute),
        $.extended_pattern,
        '=>',
        $._expression
    )),
    
    // Case and Extended Patterns
    case_pattern: $ => choice(
        $.ident_type_optional,
        seq(
            optional($.ident),
            '(',
            optional(seq(
                $.case_pattern,
                repeat(
                    seq(',', $.case_pattern)
                )
            )),
            ')'
        )
    ),

    single_extended_pattern: $ => choice(
        $.possibly_negated_literal_expression,
        $.ident_type_optional,
        seq(
            optional($.ident),
            '(',
            optional(seq(
                $.single_extended_pattern,
                repeat(
                    seq(',', $.single_extended_pattern)
                )
            )),
            ')'
        )
    ),

    extended_pattern: $ => seq(
        optional('|'),
        $.single_extended_pattern,
        repeat(seq(
            '|',
            $.single_extended_pattern
        ))
    ),

    possibly_negated_literal_expression: $ => choice(
        seq('-', choice($.nat, $.dec)),
        $.literal_expression
    ),
    
    // Quantifier expression
    quantifier_expression: $ => prec.left(seq(
        choice('forall', 'exists'),
        $.quantifier_domain,
        '::',
        $._expression
    )),
    
    // Set Comprehension Expressions
    set_comprehension_expr: $ => prec.left(seq(
        choice('set', 'iset'),
        $.quantifier_domain,
        optional(seq(
            '::',
            $._expression
        ))
    )),
    
    // Map Comprehension Expression
    map_comprehension_expr: $ => prec.left(seq(
        choice('map', 'imap'),
        $.quantifier_domain,
        '::',
        $._expression,
        optional(seq(
            ':=',
            $._expression
        ))
    )),
    
    // Statements in an Expression
    stmt_in_expr: $ => choice(
        $.assert_stmt,
        $.assume_stmt,
        $.expect_stmt,
        $.reveal_stmt,
        $.calc_stmt
    ),

    // Let and Let or Fail Expression
    let_expression: $ => prec.left(seq( // Validate
        choice(
            seq(
                optional('ghost'),
                'var',
                $.case_pattern,
                repeat(seq(
                    ',',
                    $.case_pattern
                )),
                choice(
                    ':=',
                    ':-',
                    seq(repeat($.attribute), ':|')
                ),
                $._expression,
                repeat(seq(
                    ',',
                    $._expression
                )),
            ),
            seq(
                ':-',
                $._expression
            )
        ),
        ';',
        $._expression
    )),
    
    // Name Segment
    
    _name_segment: $ => seq( // Check if should be prec.right
        $.ident,
        optional(
            choice(
                // $.generic_instantiation, // Fix this someday
                $.hash_call
        ))
    ),
    
    // Hash Call
    hash_call: $ => seq(
        '#',
        optional($.generic_instantiation),
        '[',
        $._expression,
        ']',
        '(',
        optional($.bindings),
        ')'
    ),
    
    // Suffix
    suffix: $ => choice(
        $.augmented_dot_suffix,
        $.datatype_update_suffix,
        $.subsequence_suffix,
        $.slices_by_length_suffix,
        $.sequence_update_suffix,
        $.selection_suffix,
        $.argument_list_suffix
    ),
    
    // Augmented Dot Suffix
    augmented_dot_suffix: $ => prec.right(seq(  // Check if should be prec.right
        '.',             // Base dot suffix
        choice(          //
            $.ident,     //
            $.digits,    //
            'requires',  //
            'reads',     //
        ),
        optional(
            choice(
                // $.generic_instantiation, // This thing is annoying
                $.hash_call
            )
        )
    )),

    // Datatype Update Suffix
    datatype_update_suffix: $ => seq(
        '.',
        '(',
        $.member_binding_update,
        repeat(
            seq(',', $.member_binding_update)
        ),
        ')'
    ),

    member_binding_update: $ => seq(
        choice(
            $.ident,
            $.digits
        ),
        ':=',
        $._expression
    ),

    // Subsequence Suffix
    subsequence_suffix: $ => seq(
        '[',
        optional($._expression),
        '..',
        optional($._expression),
        ']'
    ),
    
    // Subsequence Slices Suffix
    slices_by_length_suffix: $ => seq(
        '[',
        $._expression,
        ':',
        optional(seq(
            $._expression,
            repeat(
                seq(':', $._expression)
            ),
            optional(':')
        )),
        ']'
    ),
    
    // Sequence Update Suffix
    sequence_update_suffix: $ => seq(
        '[',
        commaSep1(seq( // Derived from example in 9.34.5
            $._expression,
            ':=',
            $._expression,
        )),
        ']'
    ),
    
    // Selection Suffix
    selection_suffix: $ => prec(2, seq(
        '[',
        $._expression,
        repeat(
            seq(',', $._expression)
        ),
        ']'
    )),
    
    // Argument List Suffix
    argument_list_suffix: $ => seq(
        '(',
        optional($.expressions),
        ')'
    ),
    
    // Expression Lists
    expressions: $ => seq(
        commaSep1($._expression)
    ),

    // Parameter bindings
    actual_bindings: $ => seq(
        commaSep1($.actual_binding)
    ),

    actual_binding: $ => seq(
        optional(seq(
            $._no_us_ident_or_digits,
            ':='
        )),
        $._expression
    ),

    bindings: $ => $.actual_bindings,

    // Quantifier domains
    quantifier_domain: $ => prec.right(seq(
        $.quantifier_var_decl,
        repeat(
            seq(',', $.quantifier_var_decl)
        )
    )),
    
    quantifier_var_decl: $ => prec.right(seq(
        $.ident_type_optional,
        optional(seq(
            '<-',
            $._expression
        )),
        repeat($.attribute),
        optional(seq(
            '|',
            $._expression
        )) // ?
    )),
}


function commaSep1(rule) {
    return seq(rule, repeat(seq(',', rule)));
}
