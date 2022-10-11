import { useState } from 'react'
import { ethers } from 'ethers'
import { create as IPFS } from 'ipfs-http-client'
import { useRouter } from 'next/router'
import Web3Modal from 'web3modal'

const IPFS_PROJECT_ID = "2EUTAUFaNP9H5rPha7VENq9wWgw"
const IPFS_SECRET_KEY = "53b36ef88b1333630e2edb1b593b3401"

const client = new IPFS({ 
  host: 'infura-ipfs.io', 
  port: 5001, 
  protocol: 'https',
  headers: {
    authorization: 'Basic ' + Buffer.from(IPFS_PROJECT_ID + ':' + IPFS_SECRET_KEY).toString('base64'),
  }}
);

import {
  nftaddress, nftmarketaddress
} from '../config.js'

import NFT from '../build/contracts/NFT.json'
import NFTMarket from '../build/contracts/NFTMarket.json'

export default function CreateItem() {

  const [fileUrl, setFileUrl] = useState(null)
  const [formInput, updateFormInput] = useState({ price: '', name: '', description: '' })
  const router = useRouter()


  async function onChange(e) {
    const file = e.target.files[0]
    
    try {
      const added = await client.add(
        file,
        {
          progress: (prog) => console.log(`received: ${prog}`)
        }
      )
      const url = `https://ipfs.io/ipfs/${added.path}`
      setFileUrl(url)

    } catch (error) {
      console.log('Error uploading file: ', error)
    }

  }

  async function createMarket() {
    const { name, description, price } = formInput
     
    if (!name || !description || !price || !fileUrl) return
    
    const data = JSON.stringify({
      name, description, image: fileUrl
    })

    try {
      const added = await client.add(data)

      const url = `https://ipfs.io/ipfs/${added.path}`
      
      createSale(url)

    } catch (error) {
      console.log('Error uploading file: ', error)
    }

  }

  async function createSale(url) {
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)    
    const signer = provider.getSigner()
    
    let contract = new ethers.Contract(nftaddress, NFT.abi, signer)

    let transaction = await contract.createToken(url)
    
    let tx = await transaction.wait()
    
    let event = tx.events[0]
    let value = event.args[2]
    let tokenId = value.toNumber()

    const price = ethers.utils.parseUnits(formInput.price, 'ether')

    contract = new ethers.Contract(nftmarketaddress, NFTMarket.abi, signer)

    let listingPrice = await contract.getListingPrice()
    
    listingPrice = listingPrice.toString()

    transaction = await contract.createMarketItem(nftaddress, tokenId, price, { value: listingPrice })
    
    await transaction.wait()
    router.push('/')
    
  }

  return (
    <div className="flex justify-center">
      <div className="w-1/2 flex flex-col pb-12">
        
      	<input 
          placeholder="NFT Name"
          className="mt-8 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, name: e.target.value })}
        />

        <textarea
          placeholder="NFT Description"
          className="mt-2 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, description: e.target.value })}
        />

        <input
          placeholder="NFT Price in Eth"
          className="mt-2 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, price: e.target.value })}
        />
        
        <input
          type="file"
          name="NFT"
          className="my-4"
          onChange={onChange}
        />

        {
          fileUrl && (
            <img className="rounded mt-4" width="350" src={fileUrl} />
          )
        }

        <button onClick={createMarket} className="font-bold mt-4 bg-blue-500 text-white rounded p-4 shadow-lg">
          Create NFT
        </button>

      </div>
    </div>
  )

}