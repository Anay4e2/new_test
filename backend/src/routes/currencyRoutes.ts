import { Router } from 'express';
import { getExchangeRates, convertCurrency } from '../controllers/currencyController';

const router = Router();

router.get('/rates', getExchangeRates);
router.get('/convert', convertCurrency);

export default router;
