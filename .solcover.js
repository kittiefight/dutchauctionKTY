module.exports = {
    client: require('ganache-cli'),
    providerOptions: {
      total_accounts: 50
    },
    skipFiles: [
      'Migrations.sol',
      'authority',
      'interfaces',
      'libs',
      'mocks'
    ]
  }