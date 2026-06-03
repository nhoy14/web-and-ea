#property copyright "Copyright 2026, Daj Account Soon...!"
#property link      "https://www.mql5.com"
#property version   "5.09"
#property strict

#include <Trade/Trade.mqh>
#include <Trade/PositionInfo.mqh>
CTrade trade;
CPositionInfo positionInfo;

enum ENUM_LOT_MODE { MODE_FIBO, MODE_HYBRID_FIBO, MODE_HYBRID_TRANSITION }; 
enum ENUM_TP_MODE { MODE_FIXED_PIPS, MODE_TRAILING, MODE_ADAPTIVE_ATR };

// ==================================================================
// LICENSE PROTECTION SYSTEM
// ==================================================================
datetime Allowed_ExpiryDate = D'2026.12.31 23:59'; 
const int HybridStartStepLayer = 7;     

input group "=== LICENSE SYSTEM ==="
input string LicenseKey = "ENTER-YOUR-LICENSE-KEY"; // Enter License Key

input group "=== LOT SIZE   ==="
input double BaseLotSize                  = 0.01;
input double LotMultiplier                = 1.5;     
input int    MultiplierCapLayer           = 15;    
input ENUM_LOT_MODE LotCalculatedMode     = MODE_FIBO; 

input group "=== MULTIPLIER   ==="
input bool   UseDynamicLotByEquity        = false;
input double HardMaxLotSize               = 2.0;       
input double AutoLotEquityBase            = 1000.0; 

input group "=== STOCHASTIC FILTER ==="
input bool   EnableStochFilter            = false;   
input int    StochKPeriod                 = 14;     
input int    StochDPeriod                 = 3;      
input int    StochSlowing                 = 3;    
input double StochOverbought              = 80.0;  
input double StochOversold                = 20.0;  
input bool   StochFirstEntryOnly          = true;

input group "=== BOLLINGER BANDS ==="
input int    BBPeriod                     = 20;
input double BBDeviation                  = 2.0; 
input int    BBwidthLookback              = 50;
input double BBWidthMasterMultiplier      = 1.5;

input group "=== ADAPTIVE PIP STEP ==="
input int    ATRPeriod                    = 14; 
input double ATRSimpleMultiplier          = 2.0;
input int    ATRPercentileLookback        = 50; 
input int    RangeFastBars                = 10;        
input int    RangeSlowBars                = 50;      
input double PriceRangeMasterMultiplier   = 2.25;    
input double MinAdaptiveStepPips          = 10.0;     
input double MaxAdaptiveStepPips          = 250.0;    
input double StepSmoothingAlpha           = 0.2;    
input double StepMaxIncreasePctPerUpdate  = 30.0;    
input double StepMaxDecreasePctPerUpdate  = 20.0;
input double SpreadMinStepMultiplier      = 3.0;     
       
input group "=== LAYER BASED MAX STEP CAP ==="
input bool   UseLayerBasedMaxStepCap      = true;    
input int    LayerCapBlockSize            = 5;        
input double LayerCapBlockPips            = 200.0;  
input double LayerCapHardMaxPips          = 300.0;   

input group "=== ZONE RESTRICTION ==="
input bool   EnableZoneRestriction        = true;  
     
input group "=== EQUITY PROTECTION ==="
input bool   EnableEquityProtection       = false;    
input double StopLossDrawdownPercent      = 20.0; 

input group "=== TRADING DIRECTION ==="
input bool   EnableBuy                    = true;   
input ulong  BuyMagicNumber               = 1111; 
input bool   EnableSell                   = true;              
input ulong  SellMagicNumber              = 2222;

input group "=== SAFETY FILTERS ==="
input bool   EnableSpreadFilter           = true;    
input double MaxSpreadPips                = 50.0;          
input bool   CheckMarginBeforeTrade       = true;     
input double MinFreeMarginPercentRequired = 50.0;     
input bool   PauseOnExtremeVolatility     = false;    
input double PauseIfATRMulAboveNormal     = 4.0;     
input int    ATRNormalLookbackBars        = 200;    

input group "=== BASKET TAKE PROFIT ==="
input bool   EnableBasketTakeProfit       = true;   
input ENUM_TP_MODE BasketTakeProfitMode   = MODE_FIXED_PIPS; 
input double BasketTP_FixedPips           = 50.0; 
input int    BasketTP_ATRSmoothPeriod     = 14;   
input double BasketTP_ATRMultiplierK      = 0.1;
input double TrailingPipsPercentage       = 20.0;

input group "=== SESSION FILTER ==="
input bool   EnableSessionFilter          = false;          
input string AsiaSessionLocal             = "00:00-24:00"; 

int atrHandle   = INVALID_HANDLE;
int bbHandle    = INVALID_HANDLE;
int stochHandle = INVALID_HANDLE;

double HybridVolatilityThreshold = 1.1; 
double FinalAdaptiveStepPips     = 20.0;  

double MaxBuyBasketProfitPips  = 0.0;
double MaxSellBasketProfitPips = 0.0;
string BBWidthStatus           = "NORMAL";

bool   CheckSafetyFilters();
void   CalculateMarketVolatility();
void   CalculateAdaptiveStep();
void   CheckEntryConditions();
void   CheckBasketPositions();
double CalculateLotSize(ulong magic, int currentLayers);
int    GetOpenLayersCount(ulong magic);
double GetLastOrderPrice(ulong magic);
double GetLastOrderLot(ulong magic);
bool   IsNewCandle(); 
bool   IsInsideSession();
void   CloseAllPositions();
void   CloseBasketByMagic(ulong magic);
bool   GetPositionPriceRange(ulong magic, double &minPrice, double &maxPrice);
int    GetFibonacci(int n);
double GetTodayProfit();
double GetWeeklyProfit();
double GetCurrentBasketPips(ulong magic);
bool   VerifyLicenseKey(string key, int accNumber);
bool   VerifyLicenseKeyOnline(string key, int accNumber, string &outMessage, datetime &outExpiry);

void   DrawDashboard();
void   CreateOrUpdateCard(string name, int x, int y, int cx, int cy, color bg, color borderCol);
void   CreateOrUpdateLabel(string name, string text, int x, int y, int fontSize, color c, bool bold=false);
void   CreateOrUpdateProgressBar(string name, int x, int y, int cx, int cy, double percentage, color bgCol, color fgCol);
void   ClearDashboard();

#define DB_PREFIX "SB_"

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
    int currentAccountNumber = (int)AccountInfoInteger(ACCOUNT_LOGIN);
    
    // Verify License Key
    if(!VerifyLicenseKey(LicenseKey, currentAccountNumber))
    {
        Alert(StringFormat("⚠ LICENSE ERROR: Invalid or unauthorized License Key for Account %d!", currentAccountNumber));
        ExpertRemove();
        return(INIT_FAILED);
    }
    
    if(TimeCurrent() >= Allowed_ExpiryDate)
    {
        Alert("⚠ LICENSE ERROR: This EA has expired! Please contact the developer.");
        ExpertRemove();
        return(INIT_FAILED);
    }

    atrHandle = iATR(_Symbol, _Period, ATRPeriod); 
    if(atrHandle == INVALID_HANDLE) { Print("Error: iATR Failed!"); return(INIT_FAILED); }
    
    bbHandle = iBands(_Symbol, _Period, BBPeriod, 0, BBDeviation, PRICE_CLOSE);
    if(bbHandle == INVALID_HANDLE) { Print("Error: iBands Failed!"); return(INIT_FAILED); }

    stochHandle = iStochastic(_Symbol, _Period, StochKPeriod, StochDPeriod, StochSlowing, MODE_SMA, STO_LOWHIGH);
    if(stochHandle == INVALID_HANDLE) { Print("Error: iStochastic Failed!"); return(INIT_FAILED); }

    // Reset Trailing Tracker
    MaxBuyBasketProfitPips = 0.0;
    MaxSellBasketProfitPips = 0.0;

    // Clear any previous dashboard objects to prevent overlay/clutter
    ClearDashboard();

    return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
    if(atrHandle   != INVALID_HANDLE) IndicatorRelease(atrHandle);
    if(bbHandle    != INVALID_HANDLE) IndicatorRelease(bbHandle);
    if(stochHandle != INVALID_HANDLE) IndicatorRelease(stochHandle);
    
    ClearDashboard();
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
    // Double check expiry date on ticks to prevent bypass
    if(TimeCurrent() >= Allowed_ExpiryDate)
    {
        Alert("⚠ LICENSE ERROR: This EA has expired! Please contact the developer.");
        ExpertRemove();
        return;
    }

    if(!CheckSafetyFilters()) return; 
    CalculateMarketVolatility();
    CalculateAdaptiveStep();
    
    if(EnableBasketTakeProfit) CheckBasketPositions();
    
    if(IsNewCandle())
    {
        CheckEntryConditions();
    }

    DrawDashboard();
}

//+------------------------------------------------------------------+
//| Safety filters check                                             |
//+------------------------------------------------------------------+
bool CheckSafetyFilters()
{
    if(EnableSpreadFilter)
    {
        int currentSpreadPoints = (int)SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);
        double currentSpreadPips = (double)currentSpreadPoints / 10.0;
        if(currentSpreadPips > MaxSpreadPips) return false; 
    }
    if(EnableEquityProtection)
    {
        double balance = AccountInfoDouble(ACCOUNT_BALANCE);
        double equity  = AccountInfoDouble(ACCOUNT_EQUITY);
        if(balance > 0)
        {
            double currentDrawdownPercent = ((balance - equity) / balance) * 100.0;
            if(currentDrawdownPercent >= StopLossDrawdownPercent) { CloseAllPositions(); return false; }
        }
    }
    if(CheckMarginBeforeTrade)
    {
        double margin     = AccountInfoDouble(ACCOUNT_MARGIN);
        double freeMargin = AccountInfoDouble(ACCOUNT_MARGIN_FREE);
        if(margin > 0 && (freeMargin / margin) * 100.0 < MinFreeMarginPercentRequired) return false; 
    }
    
    // Pause trading during extreme volatility
    if(PauseOnExtremeVolatility && atrHandle != INVALID_HANDLE)
    {
        double atrValues[];
        ArraySetAsSeries(atrValues, true);
        if(CopyBuffer(atrHandle, 0, 0, ATRNormalLookbackBars, atrValues) > 0)
        {
            double currentATR = atrValues[0];
            double sumATR = 0.0;
            int count = MathMin(ATRNormalLookbackBars, ArraySize(atrValues));
            for(int i = 0; i < count; i++)
            {
                sumATR += atrValues[i];
            }
            double avgATR = (count > 0) ? (sumATR / count) : 0.0;
            if(avgATR > 0 && currentATR > avgATR * PauseIfATRMulAboveNormal)
            {
                return false; 
            }
        }
    }
    
    return true;
}

//+------------------------------------------------------------------+
//| Volatility calculation                                           |
//+------------------------------------------------------------------+
void CalculateMarketVolatility()
{
    double finalPriceRangeValue = 0.0, finalATRValue = 0.0, finalBBWidthValue = 0.0;
    MqlRates rates[]; ArraySetAsSeries(rates, true);
    int maxBarsNeeded = MathMax(RangeFastBars, RangeSlowBars);
    
    if(CopyRates(_Symbol, _Period, 0, maxBarsNeeded, rates) > 0)
    {
        double fastHigh = rates[0].high, fastLow = rates[0].low;
        int limitFast = MathMin(RangeFastBars, ArraySize(rates));
        for(int i=0; i<limitFast; i++) { if(rates[i].high > fastHigh) fastHigh = rates[i].high; if(rates[i].low < fastLow) fastLow = rates[i].low; }
        double fastRange = (fastHigh - fastLow) / (_Point * 10.0); 

        double slowHigh = rates[0].high, slowLow = rates[0].low;
        int limitSlow = MathMin(RangeSlowBars, ArraySize(rates));
        for(int i=0; i<limitSlow; i++) { if(rates[i].high > slowHigh) slowHigh = rates[i].high; if(rates[i].low < slowLow)  slowLow  = rates[i].low; }
        double slowRange = (slowHigh - slowLow) / (_Point * 10.0); 

        if(slowRange > 0) finalPriceRangeValue = (fastRange / slowRange) * PriceRangeMasterMultiplier;
    }

    if(atrHandle != INVALID_HANDLE)
    {
        double atrValues[]; ArraySetAsSeries(atrValues, true);
        if(CopyBuffer(atrHandle, 0, 0, ATRPercentileLookback, atrValues) > 0)
        {
            double currentATR = atrValues[0] / (_Point * 10.0); 
            int higherCount = 0; int totalCount = MathMin(ATRPercentileLookback, ArraySize(atrValues));
            for(int i=0; i<totalCount; i++) { if(currentATR > (atrValues[i] / (_Point * 10.0))) higherCount++; }
            double atrPercentileRatio = (totalCount > 0) ? (double)higherCount / (double)totalCount : 0.0;
            finalATRValue = currentATR * ATRSimpleMultiplier * (1.0 + atrPercentileRatio);
        }
    }

    if(bbHandle != INVALID_HANDLE)
    {
        double upperValues[], lowerValues[], middleValues[];
        ArraySetAsSeries(upperValues, true); ArraySetAsSeries(lowerValues, true); ArraySetAsSeries(middleValues, true);
        if(CopyBuffer(bbHandle, 1, 0, BBwidthLookback, upperValues) > 0 && CopyBuffer(bbHandle, 2, 0, BBwidthLookback, lowerValues) > 0 && CopyBuffer(bbHandle, 0, 0, BBwidthLookback, middleValues) > 0)
        {
            double currentBBWidth = (middleValues[0] > 0) ? (upperValues[0] - lowerValues[0]) / middleValues[0] : 0.0;
            double sumBBWidth = 0.0; int actualCount = 0; int validCount = MathMin(BBwidthLookback, ArraySize(middleValues));
            for(int i=0; i<validCount; i++) { if(middleValues[i] > 0) { sumBBWidth += (upperValues[i] - lowerValues[i]) / middleValues[i]; actualCount++; } }
            double averageBBWidth = (actualCount > 0) ? (sumBBWidth / actualCount) : 0.001;
            
            if(averageBBWidth > 0)
            {
                double bbRatio = currentBBWidth / averageBBWidth;
                finalBBWidthValue = bbRatio * BBWidthMasterMultiplier;
                if(bbRatio > 1.2) BBWidthStatus = "EXPANSION";
                else if(bbRatio < 0.8) BBWidthStatus = "CONTRACTION";
                else BBWidthStatus = "NORMAL";
            }
        }
    }

    HybridVolatilityThreshold = (finalPriceRangeValue * 0.3) + (finalATRValue * 0.4) + (finalBBWidthValue * 0.3);
}

//+------------------------------------------------------------------+
//| Adaptive pip step calculation                                    |
//+------------------------------------------------------------------+
void CalculateAdaptiveStep()
{
    static double lastCalculatedStep = 0.0;
    if(lastCalculatedStep == 0.0) lastCalculatedStep = MinAdaptiveStepPips;

    double rawStep = HybridVolatilityThreshold; 
    double smoothedStep = (rawStep * StepSmoothingAlpha) + (lastCalculatedStep * (1.0 - StepSmoothingAlpha));

    double maxIncreaseLimit = lastCalculatedStep * (1.0 + (StepMaxIncreasePctPerUpdate / 100.0));
    double maxDecreaseLimit = lastCalculatedStep * (1.0 - (StepMaxDecreasePctPerUpdate / 100.0));
    if(smoothedStep > maxIncreaseLimit) smoothedStep = maxIncreaseLimit;
    if(smoothedStep < maxDecreaseLimit) smoothedStep = maxDecreaseLimit;

    lastCalculatedStep = smoothedStep;

    int currentSpreadPoints = (int)SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);
    double currentSpreadPips = (double)currentSpreadPoints / 10.0;
    double minStepBySpread = currentSpreadPips * SpreadMinStepMultiplier;

    double finalStep = smoothedStep;
    if(finalStep < minStepBySpread) finalStep = minStepBySpread;
    if(finalStep < MinAdaptiveStepPips) finalStep = MinAdaptiveStepPips;
    if(finalStep > MaxAdaptiveStepPips) finalStep = MaxAdaptiveStepPips;

    if(UseLayerBasedMaxStepCap)
    {
        int openLayers = MathMax(GetOpenLayersCount(BuyMagicNumber), GetOpenLayersCount(SellMagicNumber));
        int blockCount = openLayers / LayerCapBlockSize;
        double layerAdaptiveMaxCap = MaxAdaptiveStepPips + (blockCount * LayerCapBlockPips);
        if(layerAdaptiveMaxCap > LayerCapHardMaxPips) layerAdaptiveMaxCap = LayerCapHardMaxPips;
        if(finalStep > layerAdaptiveMaxCap) finalStep = layerAdaptiveMaxCap;
    }

    FinalAdaptiveStepPips = NormalizeDouble(finalStep, 1);
}

//+------------------------------------------------------------------+
//| Lot size calculation with dynamic models                         |
//+------------------------------------------------------------------+
double CalculateLotSize(ulong magic, int currentLayers)
{
    double baseLot = BaseLotSize;

    if(UseDynamicLotByEquity)
    {
        double equity = AccountInfoDouble(ACCOUNT_EQUITY);
        if(AutoLotEquityBase > 0)
        {
            baseLot = (equity / AutoLotEquityBase) * BaseLotSize;
        }
    }

    double lot = baseLot;

    if(currentLayers > 0)
    {
        double lastLot = GetLastOrderLot(magic);
        if(lastLot == 0.0) lastLot = lot;
        
        if(LotCalculatedMode == MODE_FIBO)
        {
            if(currentLayers < MultiplierCapLayer)
            {
                if(currentLayers < HybridStartStepLayer)
                {
                    int fiboValue = GetFibonacci(currentLayers + 1); 
                    lot = baseLot * fiboValue;
                }
                else
                {
                    lot = lastLot * LotMultiplier;
                }
            }
            else lot = lastLot; 
        } 
        else if(LotCalculatedMode == MODE_HYBRID_FIBO)
        {
            // Layers 1 to 10 use Fibonacci 
            if(currentLayers <= 10)
            {
                int fiboValue = GetFibonacci(currentLayers + 1); 
                lot = baseLot * fiboValue;
            }
            // Layers 11 and above use Martingale
            else
            {
                double lotLayer10 = baseLot * GetFibonacci(11); 
                int excessLayers = currentLayers - 10;
                lot = lotLayer10 * MathPow(LotMultiplier, excessLayers);
            }
        }         
        else if(LotCalculatedMode == MODE_HYBRID_TRANSITION)
        {
            if(currentLayers < MultiplierCapLayer)
            {
                if(currentLayers < HybridStartStepLayer)
                {
                    lot = lastLot * LotMultiplier;
                }
                else
                {
                    double hybridStepMultiplier = LotMultiplier + ((currentLayers - HybridStartStepLayer + 1) * 0.1);
                    lot = lastLot * hybridStepMultiplier;
                }
            }
            else lot = lastLot;
        }         
    }

    double minLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
    double maxLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
    
    if(lot < minLot) lot = minLot;
    if(lot > maxLot) lot = maxLot;
    
    // Apply Hard Max Lot Size Cap
    if(lot > HardMaxLotSize) lot = HardMaxLotSize;

    return NormalizeDouble(lot, 2);
}

//+------------------------------------------------------------------+
//| Fibonacci generator helper                                       |
//+------------------------------------------------------------------+
int GetFibonacci(int n)
{
    if(n <= 0) return 0;
    if(n == 1) return 1;
    
    int first = 0;
    int second = 1;
    int result = 0;
    
    for(int i = 2; i <= n; i++)
    {
        result = first + second;
        first = second;
        second = result;
    }
    return result;
}

//+------------------------------------------------------------------+
//| Grid entry execution logic                                       |
//+------------------------------------------------------------------+
void CheckEntryConditions()
{
    double stochK[], stochD[];
    ArraySetAsSeries(stochK, true); ArraySetAsSeries(stochD, true);
    if(CopyBuffer(stochHandle, 0, 1, 2, stochK) <= 0 || CopyBuffer(stochHandle, 1, 1, 2, stochD) <= 0) return;

    double currentK = stochK[0];
    double currentPriceBid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    double currentPriceAsk = SymbolInfoDouble(_Symbol, SYMBOL_ASK);

    bool insideSession = IsInsideSession();

    // --- BUY DIRECTION ---
    if(EnableBuy)
    {
        int buyLayers = GetOpenLayersCount(BuyMagicNumber);
        double nextBuyLot = CalculateLotSize(BuyMagicNumber, buyLayers);
        
        if(buyLayers == 0)
        {
            if(!EnableSessionFilter || insideSession)
            {
                bool allowedByZone = true;
                if(EnableZoneRestriction)
                {
                    double minSellPrice = 0, maxSellPrice = 0;
                    if(GetPositionPriceRange(SellMagicNumber, minSellPrice, maxSellPrice))
                    {
                        if(currentPriceAsk >= minSellPrice && currentPriceAsk <= maxSellPrice) allowedByZone = false;
                    }
                }
                
                if(allowedByZone)
                {
                    bool passBuyStoch = (!EnableStochFilter) || (currentK < StochOversold);
                    if(passBuyStoch)
                    {
                        trade.SetExpertMagicNumber(BuyMagicNumber);
                        trade.Buy(nextBuyLot, _Symbol, currentPriceAsk, 0, 0, "First Buy Layer");
                    }
                }
            }
        }
        else
        {
            double lastBuyPrice = GetLastOrderPrice(BuyMagicNumber);
            double distancePips = (lastBuyPrice - currentPriceAsk) / (_Point * 10.0);
            
            if(distancePips >= FinalAdaptiveStepPips)
            {
                bool passNextBuyStoch = (!EnableStochFilter || !StochFirstEntryOnly) || (currentK < StochOversold);
                if(passNextBuyStoch)
                {
                    trade.SetExpertMagicNumber(BuyMagicNumber);
                    trade.Buy(nextBuyLot, _Symbol, currentPriceAsk, 0, 0, StringFormat("Buy Layer %d", buyLayers+1));
                }
            }
        }
    }

    // --- SELL DIRECTION ---
    if(EnableSell)
    {
        int sellLayers = GetOpenLayersCount(SellMagicNumber);
        double nextSellLot = CalculateLotSize(SellMagicNumber, sellLayers);
        
        if(sellLayers == 0)
        {
            if(!EnableSessionFilter || insideSession)
            {
                bool allowedByZone = true;
                if(EnableZoneRestriction)
                {
                    double minBuyPrice = 0, maxBuyPrice = 0;
                    if(GetPositionPriceRange(BuyMagicNumber, minBuyPrice, maxBuyPrice))
                    {
                        if(currentPriceBid >= minBuyPrice && currentPriceBid <= maxBuyPrice) allowedByZone = false;
                    }
                }
                
                if(allowedByZone)
                {
                    bool passSellStoch = (!EnableStochFilter) || (currentK > StochOverbought);
                    if(passSellStoch)
                    {
                        trade.SetExpertMagicNumber(SellMagicNumber);
                        trade.Sell(nextSellLot, _Symbol, currentPriceBid, 0, 0, "First Sell Layer");
                    }
                }
            }
        }
        else
        {
            double lastSellPrice = GetLastOrderPrice(SellMagicNumber);
            double distancePips = (currentPriceBid - lastSellPrice) / (_Point * 10.0);
            
            if(distancePips >= FinalAdaptiveStepPips)
            {
                bool passNextSellStoch = (!EnableStochFilter || !StochFirstEntryOnly) || (currentK > StochOverbought);
                if(passNextSellStoch)
                {
                    trade.SetExpertMagicNumber(SellMagicNumber);
                    trade.Sell(nextSellLot, _Symbol, currentPriceBid, 0, 0, StringFormat("Sell Layer %d", sellLayers+1));
                }
            }
        }
    }
}

//+------------------------------------------------------------------+
//| Basket profit tracking and close actions                         |
//+------------------------------------------------------------------+
void CheckBasketPositions()
{
    ulong magics[2] = { BuyMagicNumber, SellMagicNumber };
    
    for(int m = 0; m < 2; m++)
    {
        ulong currentMagic = magics[m];
        int totalOpen = GetOpenLayersCount(currentMagic);
        
        // Reset Trailing Tracker if no positions open
        if(totalOpen == 0)
        {
            if(currentMagic == BuyMagicNumber) MaxBuyBasketProfitPips = 0.0;
            if(currentMagic == SellMagicNumber) MaxSellBasketProfitPips = 0.0;
            continue;
        }

        double totalProfitUSD = 0.0;
        double totalVolumeLots = 0.0;
        
        for(int i = PositionsTotal() - 1; i >= 0; i--)
        {
            if(positionInfo.SelectByIndex(i))
            {
                if(positionInfo.Symbol() == _Symbol && positionInfo.Magic() == currentMagic)
                {
                    totalProfitUSD += positionInfo.Profit() + positionInfo.Swap() + positionInfo.Commission();
                    totalVolumeLots += positionInfo.Volume();
                }
            }
        }

        double targetProfitUSD = 0.0;
        double currentBasketPips = 0.0;
        double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
        double tickSize  = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
        
        if(tickSize > 0 && totalVolumeLots > 0)
        {
            double pointValueInUSD = (tickValue / tickSize) * _Point; 
            
            // Current Net Pips
            currentBasketPips = totalProfitUSD / (10.0 * pointValueInUSD * totalVolumeLots);
            
            //--- MODE_FIXED_PIPS
            if(BasketTakeProfitMode == MODE_FIXED_PIPS)
            {
                targetProfitUSD = BasketTP_FixedPips * 10.0 * pointValueInUSD * totalVolumeLots;
                if(totalProfitUSD >= targetProfitUSD && targetProfitUSD > 0)
                {
                    PrintFormat("Basket Fixed TP Hit! Magic: %d, Profit: %.2f USD", currentMagic, totalProfitUSD);
                    CloseBasketByMagic(currentMagic);
                }
            }
            //--- MODE_ADAPTIVE_ATR
            else if(BasketTakeProfitMode == MODE_ADAPTIVE_ATR)
            {
                double atrValues[]; ArraySetAsSeries(atrValues, true);
                if(CopyBuffer(atrHandle, 0, 0, BasketTP_ATRSmoothPeriod, atrValues) > 0)
                {
                    double sumATR = 0; int count = MathMin(BasketTP_ATRSmoothPeriod, ArraySize(atrValues));
                    for(int k=0; k<count; k++) sumATR += atrValues[k];
                    double avgATR = (count > 0) ? sumATR / count : atrValues[0];
                    
                    double dynamicTPPips = (avgATR / (_Point * 10.0)) * BasketTP_ATRMultiplierK;
                    targetProfitUSD = dynamicTPPips * 10.0 * pointValueInUSD * totalVolumeLots;
                    
                    if(totalProfitUSD >= targetProfitUSD && targetProfitUSD > 0)
                    {
                        PrintFormat("Basket Adaptive ATR TP Hit! Magic: %d, Profit: %.2f USD", currentMagic, totalProfitUSD);
                        CloseBasketByMagic(currentMagic);
                    }
                }
            }
            //--- MODE_TRAILING 
            else if(BasketTakeProfitMode == MODE_TRAILING)
            {
                if(currentMagic == BuyMagicNumber)
                {
                    // Check if trailing has been triggered or is newly triggered
                    if(currentBasketPips >= BasketTP_FixedPips || MaxBuyBasketProfitPips > 0.0)
                    {
                        if(currentBasketPips > MaxBuyBasketProfitPips) MaxBuyBasketProfitPips = currentBasketPips;
                        
                        double trailingStopLevelBuy = MaxBuyBasketProfitPips * (1.0 - (TrailingPipsPercentage / 100.0));
                        
                        if(currentBasketPips <= trailingStopLevelBuy)
                        {
                            PrintFormat("⚠ Basket Trailing Hit! Buy Magic: %d | Max Pips: %.1f | Close at Pips: %.1f", currentMagic, MaxBuyBasketProfitPips, currentBasketPips);
                            CloseBasketByMagic(currentMagic);
                            MaxBuyBasketProfitPips = 0.0; // Reset
                        }
                    }
                }
                else if(currentMagic == SellMagicNumber)
                {
                    if(currentBasketPips >= BasketTP_FixedPips || MaxSellBasketProfitPips > 0.0)
                    {
                        if(currentBasketPips > MaxSellBasketProfitPips) MaxSellBasketProfitPips = currentBasketPips;
                        
                        double trailingStopLevelSell = MaxSellBasketProfitPips * (1.0 - (TrailingPipsPercentage / 100.0));
                        
                        if(currentBasketPips <= trailingStopLevelSell)
                        {
                            PrintFormat("⚠ Basket Trailing Hit! Sell Magic: %d | Max Pips: %.1f | Close at Pips: %.1f", currentMagic, MaxSellBasketProfitPips, currentBasketPips);
                            CloseBasketByMagic(currentMagic);
                            MaxSellBasketProfitPips = 0.0; // Reset
                        }
                    }
                }
            }
        }
    }
}

//+------------------------------------------------------------------+
//| Candle trigger detector                                          |
//+------------------------------------------------------------------+
bool IsNewCandle()
{
    datetime currentCandleTime = (datetime)SeriesInfoInteger(_Symbol, _Period, SERIES_LASTBAR_DATE);
    static datetime lastCandleTime = 0;
    
    if(currentCandleTime == 0) return false;
    
    if(currentCandleTime != lastCandleTime)
    {
        lastCandleTime = currentCandleTime;
        return true; 
    }
    return false; 
}

//+------------------------------------------------------------------+
//| Session filter utility                                           |
//+------------------------------------------------------------------+
bool IsInsideSession()
{
    MqlDateTime dt;
    TimeToStruct(TimeLocal(), dt);
    int currentMinutesSinceMidnight = dt.hour * 60 + dt.min;

    string timeParts[];
    if(StringSplit(AsiaSessionLocal, '-', timeParts) != 2) return true; 

    string startParts[], endParts[];
    if(StringSplit(timeParts[0], ':', startParts) != 2 || StringSplit(timeParts[1], ':', endParts) != 2) return true;

    int startMinutes = (int)StringToInteger(startParts[0]) * 60 + (int)StringToInteger(startParts[1]);
    int endMinutes   = (int)StringToInteger(endParts[0]) * 60 + (int)StringToInteger(endParts[1]);

    if(startMinutes < endMinutes) return (currentMinutesSinceMidnight >= startMinutes && currentMinutesSinceMidnight <= endMinutes);
    else return (currentMinutesSinceMidnight >= startMinutes || currentMinutesSinceMidnight <= endMinutes);
}

//+------------------------------------------------------------------+
//| Get position grid boundaries                                     |
//+------------------------------------------------------------------+
bool GetPositionPriceRange(ulong magic, double &minPrice, double &maxPrice)
{
    bool found = false;
    minPrice = 999999.0;
    maxPrice = 0.0;
    
    for(int i = PositionsTotal() - 1; i >= 0; i--)
    {
        if(positionInfo.SelectByIndex(i))
        {
            if(positionInfo.Symbol() == _Symbol && positionInfo.Magic() == magic)
            {
                double openPrice = positionInfo.PriceOpen();
                if(openPrice < minPrice) minPrice = openPrice;
                if(openPrice > maxPrice) maxPrice = openPrice;
                found = true;
            }
        }
    }
    return found;
}

//+------------------------------------------------------------------+
//| Last active order volume tracer                                  |
//+------------------------------------------------------------------+
double GetLastOrderLot(ulong magic)
{
    double lastLot = 0.0;
    datetime lastTime = 0;
    
    for(int i = PositionsTotal() - 1; i >= 0; i--)
    {
        if(positionInfo.SelectByIndex(i))
        {
            if(positionInfo.Symbol() == _Symbol && positionInfo.Magic() == magic)
            {
                if(positionInfo.Time() > lastTime)
                {
                    lastTime = positionInfo.Time();
                    lastLot = positionInfo.Volume();
                }
            }
        }
    }
    return lastLot;
}

//+------------------------------------------------------------------+
//| General helper utilities                                         |
//+------------------------------------------------------------------+
int GetOpenLayersCount(ulong magic)
{
    int count = 0;
    for(int i = PositionsTotal() - 1; i >= 0; i--)
    {
        if(positionInfo.SelectByIndex(i)) { if(positionInfo.Symbol() == _Symbol && positionInfo.Magic() == magic) count++; }
    }
    return count;
}

double GetLastOrderPrice(ulong magic)
{
    double lastPrice = 0.0; datetime lastTime = 0;
    for(int i = PositionsTotal() - 1; i >= 0; i--)
    {
        if(positionInfo.SelectByIndex(i))
        {
            if(positionInfo.Symbol() == _Symbol && positionInfo.Magic() == magic)
            {
                if(positionInfo.Time() > lastTime) { lastTime = positionInfo.Time(); lastPrice = positionInfo.PriceOpen(); }
            }
        }
    }
    return lastPrice;
}

void CloseBasketByMagic(ulong magic)
{
    for(int i = PositionsTotal() - 1; i >= 0; i--)
    {
        if(positionInfo.SelectByIndex(i)) { if(positionInfo.Symbol() == _Symbol && positionInfo.Magic() == magic) trade.PositionClose(positionInfo.Ticket()); }
    }
}

void CloseAllPositions()
{
    for(int i = PositionsTotal() - 1; i >= 0; i--)
    {
        if(positionInfo.SelectByIndex(i)) { if(positionInfo.Symbol() == _Symbol) trade.PositionClose(positionInfo.Ticket()); }
    }
}

// 1. Get today's profit (using Server Time to match history deals timezone)
double GetTodayProfit()
{
    double profit = 0;
    datetime serverTime = TimeCurrent();
    MqlDateTime dt;
    TimeToStruct(serverTime, dt);
    dt.hour = 0; dt.min = 0; dt.sec = 0;
    datetime startOfDay = StructToTime(dt);
    
    if(HistorySelect(startOfDay, serverTime))
    {
        int totalDeals = HistoryDealsTotal();
        for(int i = 0; i < totalDeals; i++)
        {
            ulong ticket = HistoryDealGetTicket(i);
            if(ticket > 0 && HistoryDealGetInteger(ticket, DEAL_ENTRY) == DEAL_ENTRY_OUT)
            {
                long magic = HistoryDealGetInteger(ticket, DEAL_MAGIC);
                if(magic == BuyMagicNumber || magic == SellMagicNumber)
                {
                    profit += HistoryDealGetDouble(ticket, DEAL_PROFIT) + HistoryDealGetDouble(ticket, DEAL_SWAP) + HistoryDealGetDouble(ticket, DEAL_COMMISSION);
                }
            }
        }
    }
    return profit;
}

// 2. Get weekly profit (using Server Time to match history deals timezone)
double GetWeeklyProfit()
{
    double profit = 0;
    datetime serverTime = TimeCurrent();
    MqlDateTime dt;
    TimeToStruct(serverTime, dt);
    
    int daysToSubtract = dt.day_of_week - 1;
    if(dt.day_of_week == 0) daysToSubtract = 6; 
    
    dt.hour = 0; dt.min = 0; dt.sec = 0;
    datetime startOfWeek = StructToTime(dt) - (daysToSubtract * 86400);
    
    if(HistorySelect(startOfWeek, serverTime))
    {
        int totalDeals = HistoryDealsTotal();
        for(int i = 0; i < totalDeals; i++)
        {
            ulong ticket = HistoryDealGetTicket(i);
            if(ticket > 0 && HistoryDealGetInteger(ticket, DEAL_ENTRY) == DEAL_ENTRY_OUT)
            {
                long magic = HistoryDealGetInteger(ticket, DEAL_MAGIC);
                if(magic == BuyMagicNumber || magic == SellMagicNumber)
                {
                    profit += HistoryDealGetDouble(ticket, DEAL_PROFIT) + HistoryDealGetDouble(ticket, DEAL_SWAP) + HistoryDealGetDouble(ticket, DEAL_COMMISSION);
                }
            }
        }
    }
    return profit;
}

// 3. Get current profit/loss in pips for selected magic basket
double GetCurrentBasketPips(ulong magic)
{
    int totalOpen = GetOpenLayersCount(magic);
    if(totalOpen == 0) return 0.0;

    double totalProfitUSD = 0.0;
    double totalVolumeLots = 0.0;
    
    for(int i = PositionsTotal() - 1; i >= 0; i--)
    {
        if(positionInfo.SelectByIndex(i))
        {
            if(positionInfo.Symbol() == _Symbol && positionInfo.Magic() == magic)
            {
                totalProfitUSD += positionInfo.Profit() + positionInfo.Swap() + positionInfo.Commission();
                totalVolumeLots += positionInfo.Volume();
            }
        }
    }

    double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
    double tickSize  = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
    
    if(tickSize > 0 && totalVolumeLots > 0)
    {
        double pointValueInUSD = (tickValue / tickSize) * _Point; 
        return totalProfitUSD / (10.0 * pointValueInUSD * totalVolumeLots);
    }
    return 0.0;
}

//+------------------------------------------------------------------+
//| Dashboard rendering                                              |
//+------------------------------------------------------------------+
void DrawDashboard()
{
    int x = 10;          
    int yStart = 30;     
    int width = 330;     

    // Colors
    color bgContainer = C'13,16,19';     // Dark charcoal
    color bgCard      = C'20,24,29';     // Sleek slate grey
    color borderCard  = C'35,42,50';     // Metallic outline
    color textMuted   = C'130,140,150';   // Slate blue-grey for labels
    
    // Main Container panel
    CreateOrUpdateCard("Bg", x, yStart, width, 475, bgContainer, borderCard);

    // --- Section 1: HEADER ---
    CreateOrUpdateCard("Hdr", x, yStart, width, 40, bgCard, borderCard);
    CreateOrUpdateLabel("HdrTxt", "🤖 EA TRADING SYSTEM", x+15, yStart+11, 10, clrGold, true);
    
    string statusText = "● ACTIVE";
    color statusColor = clrLime;
    if(TimeCurrent() >= Allowed_ExpiryDate) {
        statusText = "● EXPIRED";
        statusColor = clrRed;
    }
    CreateOrUpdateLabel("HdrStatus", statusText, x+250, yStart+13, 8, statusColor, true);

    int cardX = x + 10;
    int cardWidth = width - 20;

    // --- Section 2: ACCOUNT HEALTH ---
    int y = yStart + 50;
    CreateOrUpdateCard("Card_Acc", cardX, y, cardWidth, 105, bgCard, borderCard);
    CreateOrUpdateLabel("L_Acc", "ACCOUNT HEALTH", cardX+10, y+8, 7, textMuted, true);
    
    double balance = AccountInfoDouble(ACCOUNT_BALANCE);
    double equity  = AccountInfoDouble(ACCOUNT_EQUITY);
    double margin  = AccountInfoDouble(ACCOUNT_MARGIN);
    double drawdown = (balance > 0) ? ((balance - equity) / balance) * 100.0 : 0.0;
    if(drawdown < 0) drawdown = 0.0;

    double realFloating = equity - balance;
    color ddColor = clrLime;
    if(realFloating < 0) {
        ddColor = (drawdown >= StopLossDrawdownPercent * 0.7) ? clrRed : clrYellow;
    } else if(realFloating > 0) {
        ddColor = clrLime;
    }

    double marginLevel = (margin > 0) ? (equity / margin) * 100.0 : 0.0;
    string marginStatus = "SAFE";
    color marginColor = clrLime;
    if(marginLevel > 0) {
        if(marginLevel < MinFreeMarginPercentRequired * 1.5) {
            marginStatus = "WARN";
            marginColor = clrOrange;
        }
        if(marginLevel < MinFreeMarginPercentRequired) {
            marginStatus = "CRIT";
            marginColor = clrRed;
        }
    }

    CreateOrUpdateLabel("L_Bal", "Balance", cardX+10, y+28, 9, textMuted);
    CreateOrUpdateLabel("V_Bal", StringFormat("$%.2f", balance), cardX+70, y+28, 9, clrWhite);
    
    CreateOrUpdateLabel("L_Equ", "Equity", cardX+165, y+28, 9, textMuted);
    CreateOrUpdateLabel("V_Equ", StringFormat("$%.2f", equity), cardX+225, y+28, 9, clrWhite);
    
    CreateOrUpdateLabel("L_Float", "Drawdown", cardX+10, y+52, 9, textMuted);
    CreateOrUpdateLabel("V_Float", StringFormat("$%.2f (%.1f%%)", realFloating, drawdown), cardX+70, y+52, 9, ddColor);
    
    // Drawdown Progress Bar
    double ddPercent = (StopLossDrawdownPercent > 0) ? (drawdown / StopLossDrawdownPercent) * 100.0 : (drawdown / 20.0) * 100.0;
    if(ddPercent > 100.0) ddPercent = 100.0;
    if(ddPercent < 0.0) ddPercent = 0.0;
    CreateOrUpdateProgressBar("P_Drawdown", cardX+165, y+58, 125, 6, ddPercent, C'40,45,52', ddColor);

    CreateOrUpdateLabel("L_Marg", "Margin%", cardX+10, y+76, 9, textMuted);
    CreateOrUpdateLabel("V_Marg", StringFormat("%.0f%% (%s)", marginLevel, marginStatus), cardX+70, y+76, 9, marginColor);

    // Margin Health Progress Bar
    double marginPercent = (marginLevel > 0) ? (marginLevel / 2000.0) * 100.0 : 100.0;
    if(marginPercent > 100.0) marginPercent = 100.0;
    if(marginPercent < 0.0) marginPercent = 0.0;
    CreateOrUpdateProgressBar("P_Margin", cardX+165, y+82, 125, 6, marginPercent, C'40,45,52', marginColor);

    // --- Section 3: GRID STATUS ---
    y += 115;
    CreateOrUpdateCard("Card_Grid", cardX, y, cardWidth, 105, bgCard, borderCard);
    CreateOrUpdateLabel("L_Grid", "GRID & BASKET SYSTEM", cardX+10, y+8, 7, textMuted, true);

    int buyLayers  = GetOpenLayersCount(BuyMagicNumber);
    int sellLayers = GetOpenLayersCount(SellMagicNumber);
    
    string modeStr = "OTHER";
    if(LotCalculatedMode == MODE_FIBO) modeStr = "FIBONACCI";
    else if(LotCalculatedMode == MODE_HYBRID_TRANSITION) modeStr = "HYBRID_TRANS";
    else if(LotCalculatedMode == MODE_HYBRID_FIBO) {
        modeStr = (buyLayers >= 10 || sellLayers >= 10) ? "HYBRID_FIBO [⚠]" : "HYBRID_FIBO";
    }
    color modeColor = (buyLayers >= 10 || sellLayers >= 10) ? clrRed : clrYellow;

    CreateOrUpdateLabel("L_BLyr", "Buy Layers", cardX+10, y+28, 9, textMuted);
    CreateOrUpdateLabel("V_BLyr", StringFormat("%d", buyLayers), cardX+80, y+28, 9, clrWhite);
    
    CreateOrUpdateLabel("L_SLyr", "Sell Layers", cardX+165, y+28, 9, textMuted);
    CreateOrUpdateLabel("V_SLyr", StringFormat("%d", sellLayers), cardX+235, y+28, 9, clrWhite);
    
    CreateOrUpdateLabel("L_BNext", "Buy Next", cardX+10, y+50, 9, textMuted);
    CreateOrUpdateLabel("V_BNext", StringFormat("%.2f Lots", CalculateLotSize(BuyMagicNumber, buyLayers)), cardX+80, y+50, 9, clrWhite);
    
    CreateOrUpdateLabel("L_SNext", "Sell Next", cardX+165, y+50, 9, textMuted);
    CreateOrUpdateLabel("V_SNext", StringFormat("%.2f Lots", CalculateLotSize(SellMagicNumber, sellLayers)), cardX+235, y+50, 9, clrWhite);
    
    double currentBuyPips = GetCurrentBasketPips(BuyMagicNumber);
    double currentSellPips = GetCurrentBasketPips(SellMagicNumber);
    color buyPipsColor = (currentBuyPips >= 0) ? clrLime : clrRed;
    color sellPipsColor = (currentSellPips >= 0) ? clrLime : clrRed;
    if(buyLayers == 0) buyPipsColor = clrWhite;
    if(sellLayers == 0) sellPipsColor = clrWhite;

    CreateOrUpdateLabel("L_Bask", "Basket Pips", cardX+10, y+72, 9, textMuted);
    CreateOrUpdateLabel("V_BaskBuy", StringFormat("B:%.1f", currentBuyPips), cardX+80, y+72, 9, buyPipsColor);
    CreateOrUpdateLabel("V_BaskDiv", "/", cardX+125, y+72, 9, clrWhite);
    CreateOrUpdateLabel("V_BaskSell", StringFormat("S:%.1f", currentSellPips), cardX+135, y+72, 9, sellPipsColor);
    
    CreateOrUpdateLabel("L_Mode", "Mode", cardX+165, y+72, 9, textMuted);
    CreateOrUpdateLabel("V_Mode", modeStr, cardX+225, y+72, 9, modeColor);

    // --- Section 4: MARKET ENGINE ---
    y += 115;
    CreateOrUpdateCard("Card_Mkt", cardX, y, cardWidth, 80, bgCard, borderCard);
    CreateOrUpdateLabel("L_Mkt", "MARKET ENGINE", cardX+10, y+8, 7, textMuted, true);

    double stochK[]; ArraySetAsSeries(stochK, true);
    double currentStochK = 0.0;
    string stochStatus = "NORMAL";
    color stochColor = clrWhite;
    if(CopyBuffer(stochHandle, 0, 1, 1, stochK) > 0) {
        currentStochK = stochK[0];
        if(currentStochK < StochOversold) { stochStatus = "OVERSOLD"; stochColor = clrLime; }
        else if(currentStochK > StochOverbought) { stochStatus = "OVERBOUGHT"; stochColor = clrRed; }
    }

    CreateOrUpdateLabel("L_Spr", "Spread", cardX+10, y+28, 9, textMuted);
    CreateOrUpdateLabel("V_Spr", StringFormat("%.1f Pips", ((double)SymbolInfoInteger(_Symbol, SYMBOL_SPREAD)/10.0)), cardX+80, y+28, 9, clrWhite);
    
    CreateOrUpdateLabel("L_Step", "PipStep", cardX+165, y+28, 9, textMuted);
    CreateOrUpdateLabel("V_Step", StringFormat("%.1f Pips", FinalAdaptiveStepPips), cardX+225, y+28, 9, clrWhite);
    
    CreateOrUpdateLabel("L_Stoch", "Stoch K", cardX+10, y+50, 9, textMuted);
    CreateOrUpdateLabel("V_Stoch", StringFormat("%.1f [%s]", currentStochK, stochStatus), cardX+80, y+50, 9, stochColor);
    
    CreateOrUpdateLabel("L_BB", "BB Width", cardX+165, y+50, 9, textMuted);
    color bbStatusColor = clrWhite;
    if(BBWidthStatus == "EXPANSION") bbStatusColor = clrRed;
    else if(BBWidthStatus == "CONTRACTION") bbStatusColor = clrOrange;
    CreateOrUpdateLabel("V_BB", BBWidthStatus, cardX+225, y+50, 9, bbStatusColor);

    // --- Section 5: PERFORMANCE ---
    y += 90;
    CreateOrUpdateCard("Card_Perf", cardX, y, cardWidth, 65, bgCard, borderCard);
    CreateOrUpdateLabel("L_Perf", "PERFORMANCE", cardX+10, y+8, 7, textMuted, true);

    double todayProfit = GetTodayProfit();
    double weekProfit  = GetWeeklyProfit();
    color todayColor = todayProfit >= 0 ? clrLime : clrRed;
    color weekColor  = weekProfit >= 0 ? clrLime : clrRed;

    CreateOrUpdateLabel("L_Today", "Today", cardX+10, y+28, 9, textMuted);
    CreateOrUpdateLabel("V_Today", StringFormat("%s$%.2f", todayProfit>=0?"+":"", todayProfit), cardX+80, y+28, 9, todayColor, true);
    
    CreateOrUpdateLabel("L_Week", "Week", cardX+165, y+28, 9, textMuted);
    CreateOrUpdateLabel("V_Week", StringFormat("%s$%.2f", weekProfit>=0?"+":"", weekProfit), cardX+225, y+28, 9, weekColor, true);

    ChartRedraw(0); 
}

void CreateOrUpdateCard(string name, int x, int y, int cx, int cy, color bg, color borderCol) {
    string objName = DB_PREFIX + name;
    if(ObjectFind(0, objName) < 0) {
        ObjectCreate(0, objName, OBJ_RECTANGLE_LABEL, 0, 0, 0);
        ObjectSetInteger(0, objName, OBJPROP_XDISTANCE, x); 
        ObjectSetInteger(0, objName, OBJPROP_YDISTANCE, y);
        ObjectSetInteger(0, objName, OBJPROP_XSIZE, cx); 
        ObjectSetInteger(0, objName, OBJPROP_YSIZE, cy);
        ObjectSetInteger(0, objName, OBJPROP_BORDER_TYPE, BORDER_FLAT);
        ObjectSetInteger(0, objName, OBJPROP_CORNER, CORNER_LEFT_UPPER);
        ObjectSetInteger(0, objName, OBJPROP_SELECTABLE, false);
    }
    ObjectSetInteger(0, objName, OBJPROP_BGCOLOR, bg); 
    ObjectSetInteger(0, objName, OBJPROP_COLOR, borderCol);
}

void CreateOrUpdateLabel(string name, string text, int x, int y, int fontSize, color c, bool bold=false) {
    string objName = DB_PREFIX + name;
    if(ObjectFind(0, objName) < 0) {
        ObjectCreate(0, objName, OBJ_LABEL, 0, 0, 0);
        ObjectSetInteger(0, objName, OBJPROP_XDISTANCE, x); 
        ObjectSetInteger(0, objName, OBJPROP_YDISTANCE, y);
        ObjectSetInteger(0, objName, OBJPROP_FONTSIZE, fontSize);
        ObjectSetString(0, objName, OBJPROP_FONT, bold ? "Segoe UI Semibold" : "Segoe UI");
        ObjectSetInteger(0, objName, OBJPROP_CORNER, CORNER_LEFT_UPPER);
        ObjectSetInteger(0, objName, OBJPROP_SELECTABLE, false);
    }
    ObjectSetString(0, objName, OBJPROP_TEXT, text); 
    ObjectSetInteger(0, objName, OBJPROP_COLOR, c);
}

void CreateOrUpdateProgressBar(string name, int x, int y, int cx, int cy, double percentage, color bgCol, color fgCol) {
    string bgName = DB_PREFIX + name + "_bg";
    string fgName = DB_PREFIX + name + "_fg";
    
    // Background bar
    if(ObjectFind(0, bgName) < 0) {
        ObjectCreate(0, bgName, OBJ_RECTANGLE_LABEL, 0, 0, 0);
        ObjectSetInteger(0, bgName, OBJPROP_XDISTANCE, x); 
        ObjectSetInteger(0, bgName, OBJPROP_YDISTANCE, y);
        ObjectSetInteger(0, bgName, OBJPROP_XSIZE, cx); 
        ObjectSetInteger(0, bgName, OBJPROP_YSIZE, cy);
        ObjectSetInteger(0, bgName, OBJPROP_BORDER_TYPE, BORDER_FLAT);
        ObjectSetInteger(0, bgName, OBJPROP_CORNER, CORNER_LEFT_UPPER);
        ObjectSetInteger(0, bgName, OBJPROP_SELECTABLE, false);
    }
    ObjectSetInteger(0, bgName, OBJPROP_BGCOLOR, bgCol);
    ObjectSetInteger(0, bgName, OBJPROP_COLOR, bgCol);
    
    // Foreground bar (width based on percentage)
    int fgWidth = (int)MathRound(cx * percentage / 100.0);
    if(fgWidth < 0) fgWidth = 0;
    if(fgWidth > cx) fgWidth = cx;
    
    if(ObjectFind(0, fgName) < 0) {
        ObjectCreate(0, fgName, OBJ_RECTANGLE_LABEL, 0, 0, 0);
        ObjectSetInteger(0, fgName, OBJPROP_XDISTANCE, x); 
        ObjectSetInteger(0, fgName, OBJPROP_YDISTANCE, y);
        ObjectSetInteger(0, fgName, OBJPROP_YSIZE, cy);
        ObjectSetInteger(0, fgName, OBJPROP_BORDER_TYPE, BORDER_FLAT);
        ObjectSetInteger(0, fgName, OBJPROP_CORNER, CORNER_LEFT_UPPER);
        ObjectSetInteger(0, fgName, OBJPROP_SELECTABLE, false);
    }
    ObjectSetInteger(0, fgName, OBJPROP_XSIZE, fgWidth);
    ObjectSetInteger(0, fgName, OBJPROP_BGCOLOR, fgCol);
    ObjectSetInteger(0, fgName, OBJPROP_COLOR, fgCol);
}

void ClearDashboard() {
    ObjectsDeleteAll(0, DB_PREFIX);
}

//+------------------------------------------------------------------+
//| License key verification function                                |
//+------------------------------------------------------------------+
bool VerifyLicenseKey(string key, int accNumber)
{
    string trimmedKey = key;
    StringTrimLeft(trimmedKey);
    StringTrimRight(trimmedKey);
    
    // 1. Try Online Verification first
    string webMessage = "";
    datetime webExpiry = 0;
    Print("Connecting to license server to verify key: ", trimmedKey);
    
    if(VerifyLicenseKeyOnline(trimmedKey, accNumber, webMessage, webExpiry))
    {
        Print("🔒 Online License verified successfully! Expire Date: ", TimeToString(webExpiry), ". Message: ", webMessage);
        Allowed_ExpiryDate = webExpiry; // Override local expiry with server-provided expiry
        return true;
    }
    else
    {
        Print("⚠️ Online verification failed: ", webMessage);
        Print("🔄 Falling back to local offline license verification...");
    }
    
    // 2. Fallback: Local offline validation
    // Master developer/VIP license keys
    if(trimmedKey == "DAJ-VIP-2026-SOON" || trimmedKey == "DAJ-SOON-XAUUSD-VIP")
    {
        Print("🔒 Offline Master License Key verified!");
        return true;
    }
    
    // Account-specific dynamic license keys
    long calculatedHash = ((long)accNumber * 17) + 54321;
    string expectedKey = "DAJ-" + IntegerToString(accNumber) + "-" + IntegerToString(calculatedHash);
    
    if(trimmedKey == expectedKey)
    {
        Print("🔒 Offline License Key verified for account: ", accNumber);
        return true;
    }
    
    return false;
}

//+------------------------------------------------------------------+
//| Verify license key online via Python FastAPI backend             |
//+------------------------------------------------------------------+
bool VerifyLicenseKeyOnline(string key, int accNumber, string &outMessage, datetime &outExpiry)
{
    // Make sure key is not empty
    StringTrimLeft(key);
    StringTrimRight(key);
    if(key == "" || key == "ENTER-YOUR-LICENSE-KEY")
    {
        outMessage = "Please enter a valid License Key.";
        return false;
    }
    
    // Construct Request URL with live account health stats
    double balance = AccountInfoDouble(ACCOUNT_BALANCE);
    double equity = AccountInfoDouble(ACCOUNT_EQUITY);
    double todayProfit = GetTodayProfit();
    double weeklyProfit = GetWeeklyProfit();
    string brokerServer = AccountInfoString(ACCOUNT_SERVER);
    
    // URL-encode server string (replace spaces with %20)
    string cleanedServer = brokerServer;
    StringReplace(cleanedServer, " ", "%20");
    
    string url = StringFormat("http://127.0.0.1:8000/api/licenses/verify?key=%s&account=%d&balance=%.2f&equity=%.2f&today_profit=%.2f&weekly_profit=%.2f&server=%s", 
                             key, accNumber, balance, equity, todayProfit, weeklyProfit, cleanedServer);
    
    char postData[];
    char resultData[];
    string headers;
    
    // Perform WebRequest (timeout 5000ms)
    ResetLastError();
    int res = WebRequest("GET", url, NULL, NULL, 5000, postData, 0, resultData, headers);
    
    if(res == -1)
    {
        Print("WebRequest Error. Code = ", GetLastError());
        outMessage = "Cannot connect to license server. (Verify URL in Terminal Settings)";
        return false;
    }
    
    if(res != 200)
    {
        outMessage = StringFormat("Server returned error code %d", res);
        return false;
    }
    
    // Parse JSON response.
    string responseStr = CharArrayToString(resultData);
    
    // Extract status
    int statusPos = StringFind(responseStr, "\"status\":\"");
    if(statusPos == -1)
    {
        outMessage = "Invalid response format from server.";
        return false;
    }
    string statusVal = StringSubstr(responseStr, statusPos + 10);
    int statusEnd = StringFind(statusVal, "\"");
    statusVal = StringSubstr(statusVal, 0, statusEnd);
    
    // Extract message
    int msgPos = StringFind(responseStr, "\"message\":\"");
    if(msgPos != -1)
    {
        string msgVal = StringSubstr(responseStr, msgPos + 11);
        int msgEnd = StringFind(msgVal, "\"");
        outMessage = StringSubstr(msgVal, 0, msgEnd);
    }
    
    if(statusVal == "success")
    {
        // Extract expiry date
        int expPos = StringFind(responseStr, "\"expiry_date\":\"");
        if(expPos != -1)
        {
            string expVal = StringSubstr(responseStr, expPos + 15);
            int expEnd = StringFind(expVal, "\"");
            expVal = StringSubstr(expVal, 0, expEnd); // e.g. "2026.12.31 23:59"
            outExpiry = StringToTime(expVal);
        }
        return true;
    }
    
    return false;
}
