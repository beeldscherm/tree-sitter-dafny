
module.exports = {
    // Types
    type: $ => choice(
        $.domain_type,
        $.arrow_type
    ),

    domain_type: $ => choice(
        $.bool_type,
        $.char_type,
        $.int_type,
        $.real_type,
        $.ordinal_type,
        $.bitvector_type,
        $.object_type,
        $.finite_set_type,
        $.infinite_set_type,
        $.multiset_type,
        $.finite_map_type,
        $.infinite_map_type,
        $.sequence_type,
        $.nat_type,
        $.string_type,
        $.array_type,
        $.tuple_type,
        $.named_type
    ),

    named_type: $ => prec.right(seq(
        $.namesegment_for_typename,
        repeat(
            seq('.', $.namesegment_for_typename)
        )
    )),

    namesegment_for_typename: $ => prec.right(seq(
        $.ident,
        optional($.generic_instantiation) // Someday I might try and fix this
    )),

    // Basic types
    bool_type: $ => 'bool',
    int_type: $ => 'int',
    real_type: $ => 'real',
    bitvector_type: $ => $.bv_token,
    ordinal_type: $ => 'ORDINAL',
    char_type: $ => 'char',

    // Generic instantiation
    generic_instantiation: $ => seq('<', commaSep1($.type), '>'),

    // Type parameter
    generic_parameters: $ => seq(
        '<',
        optional($.variance),
        $.type_var_name,
        repeat($.type_parameter_characteristics),
        repeat(
            seq(
                ',',
                optional($.variance),
                $.type_var_name,
                repeat($.type_parameter_characteristics)
            )
        ),
        '>'
    ),

    variance: $ => choice('*', '+', '!', '-'),

    type_parameter_characteristics: $ => seq('(', commaSep1($.tp_char_option), ')'),

    tp_char_option: $ => choice(
        '==',
        '0',
        '00',
        seq('!', 'new')
    ),

    // Collection types
    finite_set_type: $ => seq(
        'set',
        $.generic_instantiation
    ),

    infinite_set_type: $ => seq(
        'iset',
        $.generic_instantiation
    ),

    multiset_type: $ => seq(
        'multiset',
        $.generic_instantiation
    ),

    sequence_type: $ => seq(
        'seq',
        $.generic_instantiation
    ),

    string_type: $ => 'string',

    finite_map_type: $ => seq(
        'map',
        $.generic_instantiation
    ),

    infinite_map_type: $ => seq(
        'imap',
        $.generic_instantiation
    ),

    // Type definitions
    synonym_type_decl: $ => choice(
        $._synonym_type_decl,
        $.opaque_type_decl,
        $.subset_type_decl
    ),

    synonym_type_name: $ => $.no_us_ident,

    _synonym_type_decl: $ => seq(
        'type',
        repeat($.attribute),
        $.synonym_type_name,
        repeat($.type_parameter_characteristics),
        optional($.generic_parameters),
        '=',
        $.type
    ),

    opaque_type_decl : $ => seq(
        'type',
        repeat($.attribute),
        $.synonym_type_name,
        repeat($.type_parameter_characteristics),
        optional($.generic_parameters),
        optional($.type_members)
    ),

    type_members: $ => seq(
        '{',
        repeat(seq(
            repeat($.decl_modifier),
            $._class_member_decl
        )),
        '}'
    ),

    subset_type_decl: $ => prec.left(seq(
        'type',
        repeat($.attribute),
        $.synonym_type_name,
        optional($.generic_parameters),
        '=',
        $.local_ident_type_optional,
        '|',
        $._expression,
        optional(
            choice(
                seq('ghost', 'witness', $._expression,),
                seq('witness', $._expression),
                seq('witness', '*')
            )
        )
    )),

    nat_type: $ => 'nat',

    newtype_decl: $ => prec.left(seq(
        'newtype',
        repeat($.attribute),
        $.newtype_name,
        '=',
        optional($.ellipsis),
        choice(
            seq(
                $.local_ident_type_optional,
                '|',
                $._expression,
                optional(
                    choice(
                        seq('ghost', 'witness', $._expression),
                        seq('witness', $._expression),
                        seq('witness', '*')
                    )
                )
            ),
            $.type
        ),
        optional($.type_members)
    )),

    // Class types
    class_decl: $ => seq(
        'class',
        repeat($.attribute),
        $.class_name,
        optional($.generic_parameters),
        optional(choice(
            seq(
                'extends',
                commaSep1($.type),
            ),
            $.ellipsis
        )),
        '{',
        repeat(seq(
            repeat($.decl_modifier),
            $._class_member_decl
        )),
        '}'
    ),

    _class_member_decl: $ => choice(
        $.field_decl,
        $.const_field_decl,
        $.function_decl,
        $.method_decl
    ),

    // Trait types
    trait_decl: $ => seq(
        'trait',
        repeat($.attribute),
        $.class_name,
        optional($.generic_parameters),
        optional(choice(
            seq(
                'extends',
                commaSep1($.type)
            ),
            $.ellipsis
        )),
        '{',
        repeat(seq(
            repeat($.decl_modifier),
            $._class_member_decl
        )),
        '}'
    ),

    // Object types
    object_type: $ => /object\??/,

    // Array types
    array_type: $ => prec.left(seq(
        $.array_token,
        optional($.generic_instantiation)
    )),

    // Tuple types (5.13)
    tuple_type: $ => seq(
        '(',
        optional(seq(
            optional('ghost'),
            $.type,
            repeat(
                seq(
                    ',',
                    optional('ghost'),
                    $.type
                )
            )
        )),
        ')'
    ),

    // Iterator types
    iterator_decl: $ => seq(
        'iterator',
        repeat($.attribute),
        $.iterator_name,
        choice(
            seq(
                optional($.generic_parameters),
                $.formals,
                optional(seq(
                    'yields',
                    $.formals
                ))
            ),
            $.ellipsis
        ),
        $.iterator_spec,
        optional($.block_stmt)
    ),

    // Arrow types
    arrow_type: $ => choice(
        seq($.domain_type, '~>', $.type),
        seq($.domain_type, '-->', $.type),
        seq($.domain_type, '->', $.type)
    ),

    // Algebraic datatypes
    datatype_decl: $ => seq(
        choice('datatype', 'codatatype'),
        repeat($.attribute),
        $.datatype_name,
        optional($.generic_parameters),
        '=',
        optional($.ellipsis),
        optional('|'),
        $.datatype_member_decl,
        repeat(seq(
            '|',
            $.datatype_member_decl
        )),
        optional($.type_members)
    ),

    datatype_member_decl: $ => seq(
        repeat($.attribute),
        $.datatype_member_name,
        optional($.formals_optional_ids)
    )
}


function commaSep1(rule) {
    return seq(rule, repeat(seq(',', rule)));
}
