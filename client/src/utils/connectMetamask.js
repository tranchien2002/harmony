/*****************************************/
/* Detect the MetaMask Ethereum provider */
/*****************************************/

import detectEthereumProvider from '@metamask/detect-provider';
import Web3 from 'web3';
import store from 'store';
import { setAddress, setChainId, setWeb3, setIsAuthorized } from 'store/eth/action.js';
// import { notification } from 'antd';

// const openNotification = (message, description) => {
//   notification.open({
//     message: message,
//     description: description,
//     onClick: () => {
//       console.log('Notification Clicked!');
//     }
//   });
// };
export const connectMetamask = async isSender => {
  // this returns the provider, or null if it wasn't detected
  const provider = await detectEthereumProvider();
  const ethereum = window.ethereum;
  const web3 = new Web3(window.ethereum);
  let chainId = await web3.eth.net.getId();

  if (chainId === 42) {
    // openNotification('Network fail', 'Please change to Ropsten testnet');
    store.dispatch(setChainId(chainId));
  } else {
    alert('Please change to Kovan testnet!');
  }
  if (provider) {
    startApp(provider); // Initialize your app
  } else {
    console.log('Please install MetaMask!');
  }

  function startApp(provider) {
    // If the provider returned by detectEthereumProvider is not the same as
    // window.ethereum, something is overwriting it, perhaps another wallet.
    if (provider !== window.ethereum) {
      console.error('Do you have multiple wallets installed?');
    } else {
      connect();
    }
    // Access the decentralized web!
  }

  /**********************************************************/
  /* Handle chain (network) and chainChanged (per EIP-1193) */
  /**********************************************************/

  // Normally, we would recommend the 'eth_chainId' RPC method, but it currently
  // returns incorrectly formatted chain ID values.

  ethereum.on('chainChanged', handleChainChanged);

  function handleChainChanged(_chainId) {
    // We recommend reloading the page, unless you must do otherwise
    window.location.reload();
  }

  /***********************************************************/
  /* Handle user accounts and accountsChanged (per EIP-1193) */
  /***********************************************************/

  let currentAccount = null;
  ethereum
    .request({ method: 'eth_accounts' })
    .then(handleAccountsChanged)
    .catch(err => {
      // Some unexpected error.
      // For backwards compatibility reasons, if no accounts are available,
      // eth_accounts will return an empty array.
      console.error(err);
    });

  // Note that this event is emitted on page load.
  // If the array of accounts is non-empty, you're already
  // connected.
  ethereum.on('accountsChanged', handleAccountsChanged);

  // For now, 'eth_accounts' will continue to always return an array
  async function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      // MetaMask is locked or the user has not connected any accounts
      store.dispatch(setWeb3(null));
      store.dispatch(setAddress(null));
      store.dispatch(setIsAuthorized(false));
      localStorage.setItem(
        'harmony_eth_session',
        JSON.stringify({
          address: ''
        })
      );
      console.log('MetaMask is disconnected');
    } else if (accounts[0] !== currentAccount) {
      const web3 = new Web3(window.ethereum);
      store.dispatch(setWeb3(web3));
      store.dispatch(setIsAuthorized(true));
      currentAccount = accounts[0];
      localStorage.setItem(
        'harmony_eth_session',
        JSON.stringify({
          address: currentAccount
        })
      );
      store.dispatch(setAddress(currentAccount));
      console.log('Connect ' + currentAccount);
      // Do any other work!
    }
  }

  /*********************************************/
  /* Access the user's accounts (per EIP-1102) */
  /*********************************************/

  // You should only attempt to request the user's accounts in response to user
  // interaction, such as a button click.
  // Otherwise, you popup-spam the user like it's 1999.
  // If you fail to retrieve the user's account(s), you should encourage the user
  // to initiate the attempt.

  function connect() {
    ethereum
      .request({ method: 'eth_requestAccounts' })
      .then(handleAccountsChanged)
      .catch(err => {
        if (err.code === 4001) {
          // EIP-1193 userRejectedRequest error
          // If this happens, the user rejected the connection request.
          store.dispatch(setAddress(null));
          console.log('Please connect to MetaMask.');
        } else {
          console.error(err);
        }
      });
  }
};

export const signOut = async isSender => {
  store.dispatch(setWeb3(null));
  store.dispatch(setAddress(null));
  store.dispatch(setIsAuthorized(false));
  localStorage.setItem(
    'harmony_eth_session',
    JSON.stringify({
      address: ''
    })
  );
};
