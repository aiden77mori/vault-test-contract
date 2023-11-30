# Specifications

### Project Overview

Vault smart contract is the one that users deposit and withdraw the whitelisted ERC20 token.

The contract have been created for the test purpose.

It allows admin add or remove ERC20 tokens and another admins.

It also has the pause and unpause functions for the unexpected accident to secure the users’ assets in the contract.

### Functional, Technical Requirements

Functional and Technical Requirements can be found in the [Requirements.pdf](./docs/Requirements.pdf) document

# Getting Started

Recommended Node version is 16.0.0 and above.

### Available commands

```bash
# install dependencies
$ yarn install

# clean hardhat
$ yarn run clean

# compile project
$ yarn run compile

# run tests
$ yarn run test

# compute tests coverage
$ yarn run coverage
```

## Tests

In the ./test folder, there are total of 4 testing files to provides the tests of the different methods of the main contracts using JavaScript. No additional keys are required to run the tests.

Both positive and negative cases are covered, and test coverage is 100%.

## Contracts

Solidity smart contracts are found in `./contracts/`

## Deploy

Deploy script can be found in the `deploy.js` folder.

Rename `./.env.example` to `./.env` in the project root.
To add the private key of a deployer account, assign the following variables

```
PRIVATEKEY=...
PROJECTID=...
ETHERSCANAPIKEY=...
```

example:

```bash
$ npm run deploy -- bsctestnet
```
