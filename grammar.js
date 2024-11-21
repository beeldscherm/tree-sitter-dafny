// Grammar for the syntax of Dafny programs
// Based on the definitions supplied in https://dafny.org/dafny/DafnyRef/DafnyRef.html

const types          = require('./grammar/types.js');
const declarations   = require('./grammar/declarations.js');
const specifications = require('./grammar/specifications.js');
const statements     = require('./grammar/statements.js');
const expressions    = require('./grammar/expressions.js');


module.exports = grammar({
    name: 'dafny',

    conflicts: $ => [
        [$.binary_expression, $.cardinality_expression], //  As described in 9.9
        [$.binary_expression], // Because '&&' <expr> is valid syntax for some reason
        // [$.guard, $.binary_expression], // Figure this out sometime
        // [$.possibly_wild_expression, $.binary_expression], // What is this '|' character doing
        [$.binary_expression, $.quantifier_var_decl],
    ],

    extras: $ => [
        /\s|\r?\n/,
        $.comment
    ],

    inline: $ => [
        $.ellipsis
    ],

    precedences: $ => [
        [
            // Dafny's precedences as defined at the start of chapter 9, but actually flipped, so
            // Highest binds most
            'primary_expression',
            'unary_expression',
            'type_test',
            'type_conversion',
            'bitwise_xor',
            'bitwise_and',
            'bitwise_or',
            'binary_times',
            'binary_plus',
            'binary_shift',
            'disjointness',
            'membership',
            'binary_relation',
            'binary_equality',
            'logic_or',
            'logic_and',
            'explication',
            'implication',
            'equivalence'
        ],
        [
            'expression',
            'clause'
        ],
    ],

    word: $ => $.ident,

    rules: {
        source_file: $ => seq(
            repeat($.include_directive),
            repeat($._top_level_decl)
        ),

        include_directive: $ => seq(
            'include',
            $.string_token
        ),

        _top_level_decl: $ => seq(
            repeat($.decl_modifier),
            choice(
                $._submodule_decl,
                $.class_decl,
                $.datatype_decl,
                $.newtype_decl,
                $.synonym_type_decl,
                $.iterator_decl,
                $.trait_decl,
                $._class_member_decl
            )
        ),

        decl_modifier: $ => choice(
            'abstract',
            'ghost',
            'static',
            'opaque'
        ),

        // Basic tokens
        array_token: $ => /array([2-9]|[1-9][0-9]+)?\??/,

        bv_token: $ => /bv(0|[1-9][0-9]*)/,
    
        ident: $ => /[A-Za-z'_?][A-Za-z'_?0-9]*/,
    
        digits: $ => /[0-9](_?[0-9])*/,
    
        hexdigits: $ => /0x[0-9A-Fa-f](_?[0-9A-Fa-f])*/,
    
        decimaldigits: $ => /[0-9](_?[0-9])*\.[0-9](_?[0-9])*/,
    
        escaped_char: $ => choice(
            '\\\'', '\\"',
            '\\\\', '\\0',
            '\\n',  '\\r',
            '\\t',
            /\\u[0-9A-Fa-f]{4}/,
            /\\U\{[0-9A-Fa-f]*\}/,
        ),
        vstr_escquotes: $ => '""',
    
        char_token: $ => seq('\'', choice(/[^\'\\\r\n]/, $.escaped_char), '\''),
    
        string_token: $ => choice(
            seq('"', repeat(choice(/[^"\\\r\n]/, $.escaped_char)), '"'),
            seq('@"', repeat(choice(/[^"]/, $.vstr_escquotes)), '"')
        ),
    
        ellipsis: $ => '...',

        // Module definitions
        _submodule_decl: $ => choice(
            $.module_definition,
            $.module_import,
            $.module_export
        ),
    
        module_definition: $ => seq(
            'module',
            repeat($.attribute),
            $.module_qualified_name,
            optional(
                seq('refines', $.module_qualified_name)
            ),
            '{', repeat($._top_level_decl), '}'
        ),
    
        module_import: $ => seq(
            'import',
            optional('opened'),
            choice(
                $.qualified_module_export,
                seq($.module_name, '=', $.qualified_module_export),
                seq($.module_name, ':', $.qualified_module_export)
            )
        ),
    
        qualified_module_export: $ => seq(
            $.module_qualified_name,
            optional(seq('`', $.module_export_suffix))
        ),
    
        module_export_suffix: $ => choice(
            $.export_id,
            seq('{', commaSep1($.export_id), '}')
        ),
    
        module_export: $ => seq(
            'export',
            optional($.export_id),
            optional('...'),
            repeat(
                choice(
                    seq('extends', commaSep1($.export_id)),
                    seq('provides', choice(commaSep1($.export_signature), '*')),
                    seq('reveals',  choice(commaSep1($.export_signature), '*')),
                )
            )
        ),
    
        export_signature: $ => seq(
            $.typename_or_ctorsuffix, 
            optional(seq('.', $.typename_or_ctorsuffix))
        ),

        ...types,
        ...declarations,
        ...specifications,
        ...statements,
        ...expressions,

        // Basic name and type combinations
        no_us_ident: $ => /[A-Za-z'?][A-Za-z'_?0-9]*/,

        wild_ident: $ => choice(
            $.no_us_ident,
            '_'
        ),

        ident_or_digits: $ => choice(
            $.ident,
            $.digits
        ),

        _no_us_ident_or_digits: $ => choice(
            $.no_us_ident,
            $.digits
        ),

        module_name: $ => $.no_us_ident,
        class_name: $ => $.no_us_ident, // Also traits
        datatype_name: $ => $.no_us_ident,
        datatype_member_name: $ => $._no_us_ident_or_digits,
        newtype_name: $ => $.no_us_ident,
        synonym_type_name: $ => $.no_us_ident,
        iterator_name: $ => $.no_us_ident,
        type_var_name: $ => $.no_us_ident,
        method_function_name: $ => $._no_us_ident_or_digits,
        label_name: $ => $._no_us_ident_or_digits,
        attribute_name: $ => $.no_us_ident,
        export_id: $ => $._no_us_ident_or_digits,
        typename_or_ctorsuffix: $ => $._no_us_ident_or_digits,

        module_qualified_name: $ => seq(
            $.module_name,
            repeat(
                seq('.', $.module_name)
            )
        ),

        ident_type: $ => seq(
            $.wild_ident,
            ':',
            $.type
        ),

        f_ident_type: $ => seq(
            $._no_us_ident_or_digits,
            ':',
            $.type
        ),

        c_ident_type: $ => seq(
            $._no_us_ident_or_digits,
            optional(seq(
                ':',
                $.type
            ))
        ),

        g_ident_type: $ => seq(
            repeat(choice(
                'ghost',
                'new',
                'nameonly',
                'older'
            )),
            $.ident_type,
            optional(seq(
                ':=',
                $._expression
            ))
        ),

        local_ident_type_optional: $ => seq(
            $.wild_ident,
            optional(seq(
                ':',
                $.type
            ))
        ),

        ident_type_optional: $ => prec.left(seq(
            $.wild_ident,
            optional(seq(
                ':',
                $.type
            ))
        )),

        type_ident_optional: $ => seq(
            repeat($.attribute),
            choice('ghost', 'nameonly'),
            optional(seq(
                $._no_us_ident_or_digits,
                ':'
            )),
            $.type,
            optional(seq(
                ':=',
                $._expression
            ))
        ),

        formals_optional_ids: $ => seq(
            '(',
            optional(seq(
                $.type_ident_optional,
                repeat(
                    seq(',', $.type_ident_optional)
                )
            )),
            ')'
        ),

        attribute: $ => seq(
            '{:',
            $.ident,
            optional($.expressions),
            '}'
        ),

        // Comments
        comment: $ => choice(
            /\/\/.*/,
            seq(
                '/*',
                repeat(
                    choice(
                        $._ml_comment,
                        /[^*]/,
                        /\*[^/]/
                    )
                ),
                '*/'
            )
        ),

        // Dont show in parse tree
        _ml_comment: $ => seq(
            '/*',
            repeat(
                choice(
                    $._ml_comment,
                    /[^*]/,
                    /\*[^/]/
                )
            ),
            '*/'
        ),
    }
});


function commaSep1(rule) {
    return seq(rule, repeat(seq(',', rule)));
}
