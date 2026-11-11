import js from '@eslint/js';
import globals from 'globals';
import jsdoc from 'eslint-plugin-jsdoc';

export default [
    js.configs.recommended,
    jsdoc.configs['flat/recommended'],
    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            // Debug
            'no-console': 'warn',

            // Imports
            'no-duplicate-imports': 'error',

            // Variables
            'no-unused-vars': ['error', {
                'args': 'after-used',
                'argsIgnorePattern': '^_',
            }],
            'no-var': 'error',
            'prefer-const': 'error',

            // Logic
            'eqeqeq': ['error', 'always'],

            // Control flow
            'no-else-return': 'error',
            'no-useless-return': 'error',

            // Modern JS style
            'object-shorthand': 'error',
            'prefer-template': 'error',

            // Formatting
            'curly': 'error',
            'quotes': ['error', 'single'],
            'semi': ['error', 'always'],

            // Whitespaces
            'no-trailing-spaces': 'error',

            // JSDoc
            'jsdoc/no-defaults': 'off',
            'jsdoc/require-returns-description': 'off',
            'jsdoc/require-param-description': 'off',
            'jsdoc/multiline-blocks': 'off',
        },
        settings: {
            jsdoc: {
                mode: 'typescript',
                tagNamePreference: {
                    augments: 'extends',
                },
            },
        },
    },
    {
        ignores: [
            'build/',
            'coverage/',
            'dist/',
            'docs/',
            'node_modules/',
        ],
    },
];
