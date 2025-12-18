'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const API_KEY = 'af7890456da818035dfd3068';
const CURRENCIES = ['USD', 'EUR', 'GBP', 'ARS', 'MXN', 'COP', 'CLP', 'BRL'];

export function CurrencyConverter() {
    const [amount, setAmount] = useState<number>(1);
    const [fromCurrency, setFromCurrency] = useState<string>('USD');
    const [toCurrency, setToCurrency] = useState<string>('EUR');
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const { t } = useTranslation('common');

    const convertCurrency = useCallback(async () => {
        if (!amount || isNaN(amount)) {
            setResult(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `https://v6.exchangerate-api.com/v6/${API_KEY}/pair/${fromCurrency}/${toCurrency}/${amount}`
            );
            const data = await response.json();

            if (data.result === 'success') {
                setResult(
                    `${amount} ${fromCurrency} = ${data.conversion_result.toFixed(2)} ${toCurrency}`
                );
            } else {
                setError(t('currencyConverter.error'));
            }
        } catch (err) {
            console.error('Currency conversion error:', err);
            setError(t('currencyConverter.error'));
        } finally {
            setLoading(false);
        }
    }, [amount, fromCurrency, toCurrency, t]);

    // Initial conversion and debounce effect could be added, but per user request "real-time" via event listeners
    // React way: useEffect dependent on inputs
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            convertCurrency();
        }, 500); // 500ms debounce to avoid API spam

        return () => clearTimeout(timeoutId);
    }, [convertCurrency]);


    return (
        <Card className="w-full bg-white shadow-sm border border-gray-200">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-center">
                    {t('currencyConverter.title')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-[1fr,auto] gap-2 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="amount">{t('currencyConverter.amount')}</Label>
                        <Input
                            id="amount"
                            type="number"
                            min="0"
                            value={amount}
                            onChange={(e) => setAmount(parseFloat(e.target.value))}
                            placeholder="1"
                        />
                    </div>
                    <div className="space-y-2 w-[100px]">
                        <Label htmlFor="from">{t('currencyConverter.from')}</Label>
                        <Select value={fromCurrency} onValueChange={setFromCurrency}>
                            <SelectTrigger id="from">
                                <SelectValue placeholder="USD" />
                            </SelectTrigger>
                            <SelectContent>
                                {CURRENCIES.map((curr) => (
                                    <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-center">
                    <RefreshCw className={`h-5 w-5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
                </div>

                <div className="grid grid-cols-[1fr,auto] gap-2 items-end">
                    <div className="space-y-2 flex-1 p-2 bg-muted rounded-md min-h-[40px] flex items-center justify-center font-medium text-sm">
                        {loading ? t('currencyConverter.loading') : error ? <span className="text-red-500">{error}</span> : result || '---'}
                    </div>
                    <div className="space-y-2 w-[100px]">
                        <Label htmlFor="to">{t('currencyConverter.to')}</Label>
                        <Select value={toCurrency} onValueChange={setToCurrency}>
                            <SelectTrigger id="to">
                                <SelectValue placeholder="EUR" />
                            </SelectTrigger>
                            <SelectContent>
                                {CURRENCIES.map((curr) => (
                                    <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <p className="text-xs text-center text-muted-foreground mt-2">
                    {t('currencyConverter.disclaimer')}
                </p>
            </CardContent>
        </Card>
    );
}
