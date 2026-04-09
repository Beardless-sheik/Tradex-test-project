const { Router } = require('express');
const {getPrices, getChartData, getSupportedCryptos} = require('../controllers/cryptoController');

const router = Router();
router.get('/prices', getPrices);
router.get('/chart/:symbol', getChartData);
router.get('/supported', getSupportedCryptos);

module.exports = router;
