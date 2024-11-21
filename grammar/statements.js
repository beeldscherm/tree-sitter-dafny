
module.exports = {
    // Statements
    // Labeled statement
    _stmt: $ => seq(
        repeat(
            seq('label', $.label_name, ':')
        ),
        $._non_labeled_stmt
    ),

    // Non-labeled_statement
    _non_labeled_stmt: $ => choice(
        $.assert_stmt, 
        $.assume_stmt, 
        $.block_stmt, 
        $.break_stmt, 
        $.calc_stmt, 
        $.expect_stmt, 
        $.forall_stmt, 
        $.if_stmt,
        $.match_stmt,
        $.modify_stmt,
        $.print_stmt,
        $.return_stmt,
        $.reveal_stmt,
        $.update_stmt,
        $.update_failure_stmt,
        $.var_decl_statement,
        $.while_stmt,
        $.for_loop_stmt,
        $.yield_stmt
    ),

    // Break and continue statements
    break_stmt: $ => choice(
        seq("break", $.label_name, ";"),
        seq("continue", $.label_name, ";"),
        seq(
            repeat("break"),
            "break", ";"
        ),
        seq(
            repeat("break"),
            "continue", ";"
        )
    ),

    // Block statement
    block_stmt: $ => seq(
        '{', repeat($._stmt), '}'
    ),

    // Return statement
    return_stmt: $ => seq(
        'return',
        commaSep($._rhs),
        ';'
    ),

    // Yield statement
    yield_stmt: $ => seq(
        'yield',
        commaSep($._rhs),
        ';'
    ),

    // Update and call statement
    update_stmt: $ => seq(
        $._lhs,
        choice(
            seq(repeat($.attribute)),
            seq(
                repeat(seq(',', $._lhs)),
                choice(
                    seq(':=', commaSep1($._rhs)),
                    seq(':|', optional('assume'), $._expression)
                )
            )
        ),
        ';'
    ),

    // Update with failure statement
    update_failure_stmt: $ => seq(
        commaSep($._lhs),
        ':-',
        optional(
            choice(
                'expect',
                'assert',
                'assume'
            )
        ),
        $._expression,
        repeat(seq(',', $._rhs)),
        ';'
    ),

    // Variable declaration statement
    var_decl_statement: $ => seq(
        optional('ghost'),
        'var',
        repeat($.attribute),
        choice(
            seq(
                commaSep1($.local_ident_type_optional),
                optional(
                    choice(
                        seq(':=', commaSep1($._rhs)),
                        seq(
                            ':-',
                            choice(
                                'expect',
                                'assert',
                                'assume'
                            ),
                            $._expression,
                            repeat(
                                seq(',', $._rhs)
                            )
                        ),
                        seq(
                            repeat($.attribute),
                            ':|',
                            optional('assume'),
                            $._expression
                        )
                    )
                )
            ),
            seq( // Good luck future me (?)
                $.case_pattern_local,
                choice(
                    ':=',
                    seq(repeat($.attribute), ':|')
                ),
                $._expression
            )
        ),
        ';'
    ),

    // Separated to avoid $.local_ident_type_optional conflict
    // seq 1 in vardecl considers $.local_ident_type_optional := $._expression already
    case_pattern_local: $ => seq(
        // optional($.ident), // Fix this
        '(',
        commaSep1($._case_pattern_local),
        ')'
    ),

    _case_pattern_local: $ => choice(
        seq(
            optional($.ident),
            '(',
            commaSep1($._case_pattern_local),
            ')'
        ),
        $.local_ident_type_optional
    ),

    // Guards
    guard: $ => prec.right(choice(
        '*',
        seq('(', '*', ')'),
        $._expression
    )),

    // Binding guards
    binding_guard: $ => seq(
        commaSep1($.ident_type_optional),
        repeat($.attribute),
        ':|',
        $._expression
    ),

    // If statement
    if_stmt: $ => prec.left(seq(
        'if',
        choice(
            // optional($.alternative_block), // Fix this pls
            seq(
                choice(
                    $.binding_guard,
                    $.guard
                ),
                $.block_stmt,
                optional(seq(
                    'else',
                    choice(
                        $.if_stmt,
                        $.block_stmt
                    )
                ))
            )
        )
    )),

    alternative_block: $ => prec(2, choice(
        repeat1($.alternative_block_case),
        seq(
            '{',
            repeat($.alternative_block_case),
            '}'
        )
    )),

    alternative_block_case: $ => prec.left(repeat1(seq(
        'case',
        choice(
            $.binding_guard,
            $._expression
        ),
        '=>',
        repeat($._stmt)
    ))),

    // While statement
    while_stmt: $ => prec.left(seq( // Inspect precedence
        'while',
        choice(
            // seq( // Fix this later
            //     optional($.loop_spec),
            //     $.alternative_block
            // ),
            seq(
                $.guard,
                optional($.loop_spec),
                optional($.block_stmt) // ?
            )
        )
    )),

    // For statement
    for_loop_stmt: $ => prec.left(seq(
        'for',
        $.ident_type_optional,
        ':=',
        $._expression,
        choice(
            'to',
            'downto'
        ),
        choice(
            '*',
            $._expression
        ),
        optional($.loop_spec),
        optional($.block_stmt) // ?
    )),

    // Match statement
    match_stmt: $ => prec.left(seq(
        'match',
        $._expression,
        choice(
            seq('{', repeat($.case_stmt), '}'),
            repeat($.case_stmt)
        )
    )),

    case_stmt: $ => prec.left(seq(
        'case',
        $.extended_pattern,
        '=>',
        repeat($._stmt)
    )),

    // Assert statement
    assert_stmt: $ => seq(
        'assert',
        repeat($.attribute),
        optional(seq(
            $.label_name,
            ':'
        )),
        $._expression,
        choice(
            ';',
            seq(
                'by',
                $.block_stmt
            )
        )
    ),

    // Assume statement
    assume_stmt: $ => seq(
        'assume',
        repeat($.attribute),
        $._expression,
        ';'
    ),

    // Expect statement
    expect_stmt: $ => seq(
        'expect',
        repeat($.attribute),
        commaSep1($._expression),
        ';'
    ),

    // Print statement
    print_stmt: $ => seq(
        'print',
        commaSep1($._expression),
        ';'
    ),

    // Reveal statement
    reveal_stmt: $ => seq(
        'reveal',
        commaSep1($._expression),
        ';'
    ),

    // Forall statement
    forall_stmt: $ => prec.left(seq(
        'forall',
        choice(
            seq('(', optional($.quantifier_domain), ')'),
            optional($.quantifier_domain)
        ),
        repeat($.ensures_clause),
        optional($.block_stmt)
    )),

    // Modify statement
    modify_stmt: $ => seq(
        'modify',
        repeat($.attribute),
        commaSep1($.frame_expression),
        ';'
    ),

    // Calc statement
    calc_stmt: $ => seq(
        'calc',
        repeat($.attribute),
        optional($.calc_op),
        '{', $.calc_body, '}'
    ),

    calc_body: $ => repeat1(seq(
        $.calc_line,
        optional($.calc_op),
        optional($.hints)
    )),

    calc_line: $ => seq($._expression, ';'),

    hints: $ => prec.left(repeat1( // Examine
        choice(
            $.block_stmt,
            $.calc_stmt
        )
    )),

    calc_op: $ => choice(
        seq('==', optional(seq('#', '[', $._expression, ']'))),
        '<',
        '>',
        '!=',
        '<=',
        '>=',
        '<==>',
        '==>',
        '<=='
    ),

    // Opaque block
    opaque_block: $ => seq(
        'opaque',
        optional($.opaque_spec),
        $.block_stmt
    ),

    opaque_spec: $ => repeat1(
        choice(
            $.modifies_clause,
            $.ensures_clause
        )
    )
}


function commaSep1(rule) {
    return seq(rule, repeat(seq(',', rule)));
}


function commaSep(rule) {
    return optional(commaSep1(rule));
}
