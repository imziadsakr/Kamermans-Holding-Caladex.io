const Web3 = require('web3');
const ethers = require('ethers');

exports.createNFT = async (req, res, next) => {
    try {
        const { nft_price } = req.body ;

        const listing_price = ethers.utils.parseUnits('0.025', 'ether') ;

        const privateKey = process.env.BALANCE_PRIVATE_KEY;
        const web3 = new Web3(new Web3.providers.HttpProvider( process.env.PROVIDER));
        const etherReceiver = new web3.eth.Contract(NFTMarketplace_ABI, process.env.NFTMarketplace_ADDR);
        
        const tx = {
            to : process.env.NFTMarketplace_ADDR,
            gasLimit: 70000,
            gasUsed: 21662,
            data : etherReceiver.methods.createNFT("image", "Bottle", "Created By MISUKA", "http://misuka.com/1.png", nft_price).encodeABI(),
            // value: ethers.utils.parseEther(amount).toString()
            value : listing_price
        }

        web3.eth.accounts.signTransaction(tx, privateKey).then(signed => {
        web3.eth.sendSignedTransaction(signed.rawTransaction)
            .then((receipt) => {
                console.log('success');
                res.status(200).json({
                    status: 'success',
                });
            })
            .catch((error) => {
                console.log('error :' + error);
                res.status(201).json({
                    status: 'failed',
                });
            });
        });
    } catch(err) {
        
    }
}

exports.buyNFT = async (req, res, next) => {
    try {
        const { buy_price, nft_id } = req.body ;

        const privateKey = process.env.BALANCE_PRIVATE_KEY;
        const web3 = new Web3(new Web3.providers.HttpProvider( process.env.PROVIDER));
        const etherReceiver = new web3.eth.Contract(NFTMarketplace_ABI, process.env.NFTMarketplace_ADDR);
        
        const tx = {
            to : process.env.NFTMarketplace_ADDR,
            gasLimit: 70000,
            gasUsed: 21662,
            data : etherReceiver.methods.buyNFT(nft_id).encodeABI(),
            value: ethers.utils.parseEther(buy_price).toString()
        }

        web3.eth.accounts.signTransaction(tx, privateKey).then(signed => {
        web3.eth.sendSignedTransaction(signed.rawTransaction)
            .then((receipt) => {
                console.log('success');
                res.status(200).json({
                    status: 'success',
                });
            })
            .catch((error) => {
                console.log('error :' + error);
                res.status(201).json({
                    status: 'failed',
                });
            });
        });

    } catch(err) {
        console.log(err) ;
    }
}

exports.resellNFT = async (req, res, next) => {
    try {
        const { resell_price, nft_id } = req.body ;

        const listing_price = ethers.utils.parseEther(0.025).toString() ;

        const privateKey = process.env.BALANCE_PRIVATE_KEY;
        const web3 = new Web3(new Web3.providers.HttpProvider( process.env.PROVIDER));
        const etherReceiver = new web3.eth.Contract(NFTMarketplace_ABI, process.env.NFTMarketplace_ADDR);
        
        const tx = {
            to : process.env.NFTMarketplace_ADDR,
            gasLimit: 70000,
            gasUsed: 21662,
            data : etherReceiver.methods.resellNFT(nft_id, resell_price).encodeABI(),
            value: listing_price
        }

        web3.eth.accounts.signTransaction(tx, privateKey).then(signed => {
        web3.eth.sendSignedTransaction(signed.rawTransaction)
            .then((receipt) => {
                console.log('success');
                res.status(200).json({
                    status: 'success',
                });
            })
            .catch((error) => {
                console.log('error :' + error);
                res.status(201).json({
                    status: 'failed',
                });
            });
        });
    } catch(err) {
        console.log(err);
    }
}