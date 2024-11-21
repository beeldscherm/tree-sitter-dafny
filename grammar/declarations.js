
module.exports = {
    // Type member declarations

    // Fields
    field_decl: $ => seq(
        'var',
        repeat($.attribute),
        $.f_ident_type,
        repeat(seq(
            ',',
            $.f_ident_type
        ))
    ),

    // Constant fields
    const_field_decl: $ => seq(
        'const',
        repeat($.attribute),
        $.c_ident_type,
        optional($.ellipsis),
        optional(seq(
            ':=',
            $._expression
        ))
    ),

    // Method declarations
    method_decl: $ => seq(
        $.method_keyword,
        repeat($.attribute),
        $.method_function_name, // !! I Removed optional() !! Probably dangerous !!
        choice(
            $.method_signature,
            $.ellipsis
        ),
        optional($.method_spec),
        optional($.block_stmt)
    ),

    method_keyword: $ => choice(
        'method',
        'constructor',
        'lemma',
        seq('twostate', 'lemma'),
        seq('least', 'lemma'),
        seq('greatest', 'lemma')
    ),

    method_signature: $ => seq(
        optional($.generic_parameters),
        optional($.ktype),
        $.formals,
        optional(
            seq('returns', $.formals)
        )
    ),

    ktype: $ => seq('[', choice('nat', 'ORDINAL'), ']'),

    formals: $ => seq(
        '(',
        optional(
            commaSep1(seq(
                repeat($.attribute),
                $.g_ident_type
            )),
        ),
        ')'
    ),

    // Function declarations
    function_decl: $ => seq(
        choice(
            seq(
                optional('twostate'),
                'function',
                optional('method'),
                repeat($.attribute),
                $.method_function_name,
                $.function_signature_or_ellipsis
            ),
            seq(
                'predicate',
                optional('method'),
                repeat($.attribute),
                $.method_function_name,
                $.predicate_signature_or_ellipsis
            ),
            seq(
                choice('least', 'greatest'),
                'predicate',
                repeat($.attribute),
                $.method_function_name,
                $.predicate_signature_or_ellipsis
            )
        ),
        optional($.function_spec),
        optional($.function_body),
    ),

    function_signature_or_ellipsis: $ => choice(
        $.function_signature,
        $.ellipsis
    ),

    function_signature: $ => seq(
        optional($.generic_parameters),
        $.formals,
        ':',
        choice(
            $.type,
            seq('(', $.g_ident_type, ')')
        )
    ),

    predicate_signature_or_ellipsis: $ => choice(
        $.predicate_signature,
        $.ellipsis
    ),

    predicate_signature: $ => seq(
        optional($.generic_parameters),
        optional($.ktype),
        $.formals,
        optional(seq(
            ':',
            choice(
                $.type,
                seq('(', $.ident, ':', 'bool', ')')
            )
        ))
    ),

    function_body: $ => seq(
        '{', $._expression, '}',
        optional(
            seq('by', 'method', $.block_stmt)
        )
    )
}


function commaSep1(rule) {
    return seq(rule, repeat(seq(',', rule)));
}
