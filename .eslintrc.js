// eslint-disable-next-line no-undef
module.exports = {
	root: true,
	// eslint parser option
	parser: '@typescript-eslint/parser',
	// typescript-eslint provides rules
	plugins: ['@typescript-eslint'],
	// eslint rules
	// default option
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
	],

	rules: {
		// error without semicolon
		semi: 'error',
		// error with unused variables
		'@typescript-eslint/no-unused-vars': 'error'
	}
};