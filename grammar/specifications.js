
module.exports = {
    // Method specifications
    method_spec: $ => repeat1(
        choice(
            $.modifies_clause,
            $.requires_clause,
            $.ensures_clause,
            $.decreases_clause
        )
    ),

    // Function specifications
    function_spec: $ => repeat1(
        choice(
            $.requires_clause,
            $.reads_clause,
            $.ensures_clause,
            $.decreases_clause
        )
    ),

    // Lambda function specifications
    lambda_spec: $ => repeat1(
        choice(
            $.reads_clause,
            seq('requires', $._expression)
        )
    ),

    // Iterator specifications
    iterator_spec: $ => repeat1(
        choice(
            $.reads_clause,
            $.modifies_clause,
            seq(
                optional('yield'),
                $.requires_clause
            ),
            seq(
                optional('yield'),
                $.ensures_clause
            ),
            $.decreases_clause
        )
    ),

    // Loop specifications
    loop_spec: $ => repeat1(
        choice(
            $.invariant_clause,
            $.decreases_clause,
            $.modifies_clause
        )
    ),

    // Requires clauses
    requires_clause: $ => seq(
        'requires',
        repeat($.attribute),
        optional(
            seq($.label_name, ':')
        ),
        $._expression
    ),

    // Ensures clauses
    ensures_clause: $ => prec.left(seq( // Check precedence
        'ensures',
        repeat($.attribute),
        $._expression
    )),

    // Decreases clauses
    decreases_clause: $ => seq(
        'decreases',
        repeat($.attribute),
        $.decreases_list
    ),

    decreases_list: $ => seq(commaSep1($.possibly_wild_expression)),

    possibly_wild_expression: $ => prec.right(choice(
        '*',
        $._expression
    )),

    // Modifies clauses
    modifies_clause: $ => seq(
        'modifies',
        repeat($.attribute),
        commaSep1($.frame_expression)
    ),

    // Invariant clauses
    invariant_clause: $ => prec.right(seq(
        'invariant',
        repeat($.attribute),
        $._expression
    )),

    // Reads clauses
    reads_clause: $ => seq(
        'reads',
        repeat($.attribute),
        commaSep1($.possibly_wild_frame_expression)
    ),

    // Frame expresions
    frame_expression: $ => prec.left(choice(
        seq(
            $._expression,
            optional($.frame_field)
        ),
        $.frame_field
    )),

    frame_field: $ => seq(
        '`',
        $.ident_or_digits
    ),

    possibly_wild_frame_expression: $ => choice(
        '*',
        $.frame_expression
    )
}


function commaSep1(rule) {
    return seq(rule, repeat(seq(',', rule)));
}
