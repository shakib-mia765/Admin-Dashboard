import js from '@eslint/js';
export default [js.configs.recommended,{files:['**/*.{js,jsx}'],languageOptions:{ecmaVersion:'latest',sourceType:'module',parserOptions:{ecmaFeatures:{jsx:true}}},rules:{'no-unused-vars':['error',{argsIgnorePattern:'^_'}]}}];
