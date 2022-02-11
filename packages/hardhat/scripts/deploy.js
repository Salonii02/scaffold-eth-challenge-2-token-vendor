/* eslint no-use-before-define: "warn" */
const fs = require('fs');
const chalk = require('chalk');
const {config, ethers} = require('hardhat');
const {utils} = require('ethers');
const R = require('ramda');

const main = async () => {
  console.log('\n\n 📡 Deploying...\n');

  const yourToken = await deploy('YourToken');
  // const result = await yourToken.transfer('0xafDD110869ee36b7F2Af508ff4cEB2663f068c6A', utils.parseEther('1000'));

  //Todo: deploy the vendor
  const vendor = await deploy('Vendor', [yourToken.address]);
  console.log('\n 🤹  Sending ownership to frontend address...\n');
  //ToDo: change address with your burner wallet address vvvv
  await vendor.transferOwnership('0xafDD110869ee36b7F2Af508ff4cEB2663f068c6A');


  console.log(' 💾  Artifacts (address, abi, and args) saved to: ', chalk.blue('packages/hardhat/artifacts/'), '\n\n');
};

const deploy = async (contractName, _args = [], overrides = {}, libraries = {}) => {
  console.log(` 🛰  Deploying: ${contractName}`);

  const contractArgs = _args || [];
  const contractArtifacts = await ethers.getContractFactory(contractName, {libraries: libraries});
  const deployed = await contractArtifacts.deploy(...contractArgs, overrides);
  const encoded = abiEncodeArgs(deployed, contractArgs);
  fs.writeFileSync(`artifacts/${contractName}.address`, deployed.address);

  console.log(' 📄', chalk.cyan(contractName), 'deployed to:', chalk.magenta(deployed.address));

  if (!encoded || encoded.length <= 2) return deployed;
  fs.writeFileSync(`artifacts/${contractName}.args`, encoded.slice(2));

  return deployed;
};

// ------ utils -------

// abi encodes contract arguments
// useful when you want to manually verify the contracts
// for example, on Etherscan
const abiEncodeArgs = (deployed, contractArgs) => {
  // not writing abi encoded args if this does not pass
  if (!contractArgs || !deployed || !R.hasPath(['interface', 'deploy'], deployed)) {
    return '';
  }
  const encoded = utils.defaultAbiCoder.encode(deployed.interface.deploy.inputs, contractArgs);
  return encoded;
};

// checks if it is a Solidity file
const isSolidity = (fileName) =>
  fileName.indexOf('.sol') >= 0 && fileName.indexOf('.swp') < 0 && fileName.indexOf('.swap') < 0;

const readArgsFile = (contractName) => {
  let args = [];
  try {
    const argsFile = `./contracts/${contractName}.args`;
    if (!fs.existsSync(argsFile)) return args;
    args = JSON.parse(fs.readFileSync(argsFile));
  } catch (e) {
    console.log(e);
  }
  return args;
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
