const canvas = document.getElementById("candlestickChart");

if (!canvas) {
    throw new Error("Canvas with id 'candlestickChart' was not found.");
}

const ctx = canvas.getContext("2d");


// ==============================
// CHART SETTINGS
// ==============================

const startX = 80;
let spacing = 70;

const minZoomSpacing = 35;
const maxZoomSpacing = 140;


// ==============================
// TRADING VARIABLES
// ==============================

let balance = 100000;
let portfolioQuantity = 0;
let buyPrice = 0;
let currentPrice = 0;


// ==============================
// CHART VARIABLES
// ==============================

let candles = [];
let candleTimer = null;
let clockTimer = null;


// ==============================
// HTML ELEMENTS
// ==============================

const balanceElement = document.getElementById("balance");
const quantityElement = document.getElementById("quantity");

const buyButton = document.getElementById("buyButton");
const sellButton = document.getElementById("sellButton");
const resetButton = document.getElementById("resetButton");

const portfolioQuantityElement =
    document.getElementById("portfolioQuantity");

const buyPriceElement =
    document.getElementById("buyPrice");

const currentPriceElement =
    document.getElementById("currentPrice");

const profitLossElement =
    document.getElementById("profitLoss");

const profitLossPercentElement =
    document.getElementById("profitLossPercent");

const transactionHistoryElement =
    document.getElementById("transactionHistory");

const timeframeElement =
    document.getElementById("timeframe");

const autoUpdateElement =
    document.getElementById("autoUpdate");

const showLevelsElement =
    document.getElementById("showLevels");

const showMAElement =
    document.getElementById("showMA");

const marketOpenElement =
    document.getElementById("marketOpen");

const marketHighElement =
    document.getElementById("marketHigh");

const marketLowElement =
    document.getElementById("marketLow");

const marketCloseElement =
    document.getElementById("marketClose");

const marketCurrentPriceElement =
    document.getElementById("marketCurrentPrice");

const marketChangeElement =
    document.getElementById("marketChange");

const currentValueElement =
    document.getElementById("currentValue");

const orderValueElement =
    document.getElementById("orderValue");


// ==============================
// PRICE TO CANVAS POSITION
// ==============================

function priceToY(price, highestPrice, lowestPrice) {

    const chartTop = 30;
    const chartBottom = 350;

    const chartHeight = chartBottom - chartTop;

    if (highestPrice === lowestPrice) {
        return (chartTop + chartBottom) / 2;
    }

    return (
        chartBottom -
        ((price - lowestPrice) /
            (highestPrice - lowestPrice)) *
            chartHeight
    );
}


// ==============================
// GRID LINES
// ==============================

function drawGridLines(highestPrice, lowestPrice) {

    ctx.strokeStyle = "#26313d";
    ctx.lineWidth = 1;

    const numberOfLines = 5;

    for (let i = 0; i <= numberOfLines; i++) {

        const price =
            lowestPrice +
            (highestPrice - lowestPrice) *
                (i / numberOfLines);

        const y =
            priceToY(
                price,
                highestPrice,
                lowestPrice
            );

        ctx.beginPath();

        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);

        ctx.stroke();

        ctx.fillStyle = "#94a3b8";
        ctx.font = "12px Arial";
        ctx.textAlign = "left";

        ctx.fillText(
            "₹" + price.toFixed(0),
            canvas.width - 55,
            y - 5
        );
    }
}


// ==============================
// DRAW CANDLE
// ==============================

function drawCandle(
    candle,
    x,
    highestPrice,
    lowestPrice
) {

    const highY =
        priceToY(
            candle.high,
            highestPrice,
            lowestPrice
        );

    const lowY =
        priceToY(
            candle.low,
            highestPrice,
            lowestPrice
        );

    const openY =
        priceToY(
            candle.open,
            highestPrice,
            lowestPrice
        );

    const closeY =
        priceToY(
            candle.close,
            highestPrice,
            lowestPrice
        );

    const bullish =
        candle.close >= candle.open;

    if (bullish) {
        ctx.fillStyle = "#22c55e";
        ctx.strokeStyle = "#22c55e";
    } else {
        ctx.fillStyle = "#ef4444";
        ctx.strokeStyle = "#ef4444";
    }


    // Wick

    ctx.beginPath();

    ctx.moveTo(x, highY);
    ctx.lineTo(x, lowY);

    ctx.stroke();


    // Body

    const bodyTop =
        Math.min(openY, closeY);

    const bodyHeight =
        Math.abs(openY - closeY);

    ctx.fillRect(
        x - 18,
        bodyTop,
        36,
        Math.max(bodyHeight, 3)
    );


    // Time

    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
        candle.time,
        x,
        390
    );
}


// ==============================
// SUPPORT / RESISTANCE
// ==============================

function calculateSupportResistance() {

    if (candles.length < 2) {
        return null;
    }

    const recentCandles =
        candles.slice(-10);

    const resistance =
        Math.max(
            ...recentCandles.map(
                candle => candle.high
            )
        );

    const support =
        Math.min(
            ...recentCandles.map(
                candle => candle.low
            )
        );

    return {
        support,
        resistance
    };
}


function drawSupportResistance(
    highestPrice,
    lowestPrice
) {

    if (
        !showLevelsElement ||
        !showLevelsElement.checked ||
        candles.length < 2
    ) {
        return;
    }

    const levels =
        calculateSupportResistance();

    if (!levels) {
        return;
    }

    const supportY =
        priceToY(
            levels.support,
            highestPrice,
            lowestPrice
        );

    const resistanceY =
        priceToY(
            levels.resistance,
            highestPrice,
            lowestPrice
        );


    // Support

    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 1;

    ctx.setLineDash([6, 5]);

    ctx.beginPath();

    ctx.moveTo(0, supportY);
    ctx.lineTo(canvas.width, supportY);

    ctx.stroke();


    // Resistance

    ctx.strokeStyle = "#ef4444";

    ctx.beginPath();

    ctx.moveTo(0, resistanceY);
    ctx.lineTo(canvas.width, resistanceY);

    ctx.stroke();

    ctx.setLineDash([]);


    // Support label

    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "left";

    ctx.fillText(
        "SUPPORT ₹" +
            levels.support.toFixed(2),
        8,
        supportY - 6
    );


    // Resistance label

    ctx.fillStyle = "#ef4444";

    ctx.fillText(
        "RESISTANCE ₹" +
            levels.resistance.toFixed(2),
        8,
        resistanceY - 6
    );
}


// ==============================
// MOVING AVERAGE
// ==============================

function calculateMovingAverage(period = 5) {

    const movingAverage = [];

    for (
        let i = 0;
        i < candles.length;
        i++
    ) {

        if (i < period - 1) {

            movingAverage.push(null);

            continue;
        }

        let sum = 0;

        for (
            let j = i - period + 1;
            j <= i;
            j++
        ) {

            sum += candles[j].close;
        }

        movingAverage.push(
            sum / period
        );
    }

    return movingAverage;
}


function drawMovingAverage(
    highestPrice,
    lowestPrice
) {

    if (
        !showMAElement ||
        !showMAElement.checked ||
        candles.length < 5
    ) {
        return;
    }

    const movingAverage =
        calculateMovingAverage(5);

    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 3;

    ctx.beginPath();

    let started = false;

    movingAverage.forEach(
        (value, index) => {

            if (value === null) {
                return;
            }

            const x =
                startX +
                index * spacing;

            const y =
                priceToY(
                    value,
                    highestPrice,
                    lowestPrice
                );

            if (!started) {

                ctx.moveTo(x, y);

                started = true;

            } else {

                ctx.lineTo(x, y);
            }
        }
    );

    ctx.stroke();
}


// ==============================
// RENDER CHART
// ==============================

function renderChart() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    if (candles.length === 0) {
        return;
    }

    const highestPrice =
        Math.max(
            ...candles.map(
                candle => candle.high
            )
        );

    const lowestPrice =
        Math.min(
            ...candles.map(
                candle => candle.low
            )
        );


    drawGridLines(
        highestPrice,
        lowestPrice
    );


    drawSupportResistance(
        highestPrice,
        lowestPrice
    );


    // Candlesticks

    candles.forEach(
        (candle, index) => {

            const x =
                startX +
                index * spacing;

            drawCandle(
                candle,
                x,
                highestPrice,
                lowestPrice
            );
        }
    );


    // Moving Average

    drawMovingAverage(
        highestPrice,
        lowestPrice
    );
}


// ==============================
// TIME
// ==============================

function getCurrentTime() {

    const now = new Date();

    const hours =
        String(
            now.getHours()
        ).padStart(2, "0");

    const minutes =
        String(
            now.getMinutes()
        ).padStart(2, "0");

    const seconds =
        String(
            now.getSeconds()
        ).padStart(2, "0");

    return {
        hours,
        minutes,
        seconds
    };
}


function getCurrentTimeString() {

    const time = getCurrentTime();

    return (
        time.hours +
        ":" +
        time.minutes
    );
}


// ==============================
// ZOOM
// ==============================

function zoomIn() {

    spacing =
        Math.min(
            maxZoomSpacing,
            spacing + 10
        );

    renderChart();
}


function zoomOut() {

    spacing =
        Math.max(
            minZoomSpacing,
            spacing - 10
        );

    renderChart();
}


function resetZoom() {

    spacing = 70;

    renderChart();
}


// ==============================
// CURRENT PRICE
// ==============================

function updateCurrentPrice() {

    currentPriceElement.textContent =
        currentPrice.toFixed(2);
}


// ==============================
// GENERATE NEXT CANDLE
// ==============================

function generateNextCandle() {

    if (candles.length === 0) {
        return;
    }

    const previousCandle =
        candles[candles.length - 1];

    const open =
        previousCandle.close;

    const randomFactor =
        Math.random() - 0.5;

    const movement =
        randomFactor * 8;

    const close =
        Math.max(
            1,
            open + movement
        );

    const candleTop =
        Math.max(open, close);

    const candleBottom =
        Math.min(open, close);

    const high =
        candleTop +
        Math.random() * 4;

    const low =
        candleBottom -
        Math.random() * 4;

    const newCandle = {

        time:
            getCurrentTimeString(),

        open:
            Number(
                open.toFixed(2)
            ),

        high:
            Number(
                high.toFixed(2)
            ),

        low:
            Number(
                Math.max(
                    1,
                    low
                ).toFixed(2)
            ),

        close:
            Number(
                close.toFixed(2)
            )
    };

    candles.push(newCandle);

    if (candles.length > 10) {
        candles.shift();
    }

    currentPrice =
        newCandle.close;

    updateCurrentPrice();
    updateMarketInformation();
    updateOrderValue();
    updateProfitLoss();

    renderChart();
}


// ==============================
// MARKET INFORMATION
// ==============================

function updateMarketInformation() {

    if (candles.length === 0) {
        return;
    }

    const latestCandle =
        candles[candles.length - 1];

    const change =
        latestCandle.close -
        latestCandle.open;

    const changePercent =
        latestCandle.open !== 0
            ? (change / latestCandle.open) * 100
            : 0;

    marketOpenElement.textContent =
        "₹" +
        latestCandle.open.toFixed(2);

    marketHighElement.textContent =
        "₹" +
        latestCandle.high.toFixed(2);

    marketLowElement.textContent =
        "₹" +
        latestCandle.low.toFixed(2);

    marketCloseElement.textContent =
        "₹" +
        latestCandle.close.toFixed(2);

    marketCurrentPriceElement.textContent =
        "₹" +
        currentPrice.toFixed(2);

    marketChangeElement.textContent =
        (change >= 0 ? "+" : "") +
        "₹" +
        change.toFixed(2) +
        " (" +
        (change >= 0 ? "+" : "") +
        changePercent.toFixed(2) +
        "%)";

    if (change >= 0) {

        marketChangeElement.style.color =
            "#22c55e";

    } else {

        marketChangeElement.style.color =
            "#ef4444";
    }
}


// ==============================
// ORDER VALUE
// ==============================

function updateOrderValue() {

    const quantity =
        Number(
            quantityElement.value
        );

    const orderValue =
        quantity *
        currentPrice;

    orderValueElement.textContent =
        "₹" +
        orderValue.toFixed(2);
}


// ==============================
// CURRENT PORTFOLIO VALUE
// ==============================

function updateCurrentValue() {

    const currentValue =
        portfolioQuantity *
        currentPrice;

    currentValueElement.textContent =
        "₹" +
        currentValue.toFixed(2);
}


// ==============================
// PROFIT / LOSS
// ==============================

function updateProfitLoss() {

    const profitLoss =
        (
            currentPrice -
            buyPrice
        ) *
        portfolioQuantity;

    profitLossElement.textContent =
        profitLoss.toFixed(2);

    let profitLossPercent = 0;

    if (
        buyPrice > 0 &&
        portfolioQuantity > 0
    ) {

        profitLossPercent =
            (
                (
                    currentPrice -
                    buyPrice
                ) /
                buyPrice
            ) *
            100;
    }

    profitLossPercentElement.textContent =
        profitLossPercent.toFixed(2) +
        "%";

    updateCurrentValue();
}


// ==============================
// CANDLE TIMER
// ==============================

function startCandleTimer() {

    stopCandleTimer();

    if (!autoUpdateElement.checked) {
        return;
    }

    const timeframe =
        Number(
            timeframeElement.value
        );

    const interval =
        timeframe *
        60 *
        1000;

    candleTimer =
        setInterval(
            function () {

                generateNextCandle();

            },
            interval
        );
}


function stopCandleTimer() {

    if (candleTimer !== null) {

        clearInterval(candleTimer);

        candleTimer = null;
    }
}


// ==============================
// LIVE CLOCK
// ==============================

function startLiveClock() {

    stopLiveClock();

    clockTimer =
        setInterval(
            function () {

                updateLiveTime();

            },
            1000
        );
}


function stopLiveClock() {

    if (clockTimer !== null) {

        clearInterval(clockTimer);

        clockTimer = null;
    }
}


function updateLiveTime() {

    const time =
        getCurrentTimeString();

    if (candles.length > 0) {

        candles[
            candles.length - 1
        ].time = time;

        renderChart();
    }
}


// ==============================
// LOAD CANDLES
// ==============================

async function loadCandles() {

    try {

        const response =
            await fetch("stock.json");

        if (!response.ok) {

            throw new Error(
                "stock.json could not be loaded."
            );
        }

        const data =
            await response.json();

        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {

            throw new Error(
                "stock.json contains no candle data."
            );
        }

        candles = data;

        candles[
            candles.length - 1
        ].time =
            getCurrentTimeString();

        currentPrice =
            candles[
                candles.length - 1
            ].close;

        updateCurrentPrice();
        updateMarketInformation();
        updateOrderValue();
        updateProfitLoss();

        renderChart();

        startLiveClock();
        startCandleTimer();

        console.log(
            "Candlestick chart loaded successfully."
        );

    } catch (error) {

        console.error(
            "Chart loading error:",
            error
        );
    }
}


// ==============================
// LOCAL STORAGE
// ==============================

function saveTradingData() {

    localStorage.setItem(
        "tradingData",
        JSON.stringify({

            balance:
                balance,

            portfolioQuantity:
                portfolioQuantity,

            buyPrice:
                buyPrice
        })
    );
}


function loadTradingData() {

    const savedData =
        localStorage.getItem(
            "tradingData"
        );

    if (savedData) {

        try {

            const data =
                JSON.parse(savedData);

            balance =
                Number(data.balance);

            portfolioQuantity =
                Number(
                    data.portfolioQuantity
                );

            buyPrice =
                Number(data.buyPrice);

        } catch (error) {

            console.error(
                "Trading data error:",
                error
            );
        }
    }

    balanceElement.textContent =
        balance.toFixed(2);

    portfolioQuantityElement.textContent =
        portfolioQuantity;

    buyPriceElement.textContent =
        buyPrice.toFixed(2);
}


function saveTransactionHistory() {

    localStorage.setItem(
        "transactionHistory",
        transactionHistoryElement.innerHTML
    );
}


function loadTransactionHistory() {

    const savedHistory =
        localStorage.getItem(
            "transactionHistory"
        );

    if (savedHistory) {

        transactionHistoryElement.innerHTML =
            savedHistory;
    }
}


// ==============================
// BUY
// ==============================

buyButton.addEventListener(
    "click",
    function () {

        const quantity =
            Number(
                quantityElement.value
            );

        if (
            !Number.isFinite(quantity) ||
            quantity <= 0
        ) {

            alert(
                "Enter a valid quantity!"
            );

            return;
        }

        const totalCost =
            quantity *
            currentPrice;

        if (totalCost > balance) {

            alert(
                "Insufficient balance!"
            );

            return;
        }

        const oldQuantity =
            portfolioQuantity;

        const oldTotalValue =
            buyPrice *
            oldQuantity;

        balance =
            balance -
            totalCost;

        portfolioQuantity =
            portfolioQuantity +
            quantity;

        buyPrice =
            (
                oldTotalValue +
                totalCost
            ) /
            portfolioQuantity;

        balanceElement.textContent =
            balance.toFixed(2);

        portfolioQuantityElement.textContent =
            portfolioQuantity;

        buyPriceElement.textContent =
            buyPrice.toFixed(2);

        updateProfitLoss();

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>BUY</td>
            <td>${quantity}</td>
            <td>₹${currentPrice.toFixed(2)}</td>
            <td>₹${totalCost.toFixed(2)}</td>
        `;

        transactionHistoryElement
            .appendChild(row);

        saveTradingData();
        saveTransactionHistory();

        alert("BUY successful!");
    }
);


// ==============================
// SELL
// ==============================

sellButton.addEventListener(
    "click",
    function () {

        const quantity =
            Number(
                quantityElement.value
            );

        if (
            !Number.isFinite(quantity) ||
            quantity <= 0
        ) {

            alert(
                "Enter a valid quantity!"
            );

            return;
        }

        if (
            quantity >
            portfolioQuantity
        ) {

            alert(
                "You do not have enough shares!"
            );

            return;
        }

        const totalValue =
            quantity *
            currentPrice;

        balance =
            balance +
            totalValue;

        portfolioQuantity =
            portfolioQuantity -
            quantity;

        if (
            portfolioQuantity === 0
        ) {

            buyPrice = 0;
        }

        balanceElement.textContent =
            balance.toFixed(2);

        portfolioQuantityElement.textContent =
            portfolioQuantity;

        buyPriceElement.textContent =
            buyPrice.toFixed(2);

        updateProfitLoss();

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>SELL</td>
            <td>${quantity}</td>
            <td>₹${currentPrice.toFixed(2)}</td>
            <td>₹${totalValue.toFixed(2)}</td>
        `;

        transactionHistoryElement
            .appendChild(row);

        saveTradingData();
        saveTransactionHistory();

        alert("SELL successful!");
    }
);


// ==============================
// RESET PORTFOLIO
// ==============================

resetButton.addEventListener(
    "click",
    function () {

        balance = 100000;
        portfolioQuantity = 0;
        buyPrice = 0;

        localStorage.removeItem(
            "tradingData"
        );

        localStorage.removeItem(
            "transactionHistory"
        );

        balanceElement.textContent =
            "100000.00";

        portfolioQuantityElement.textContent =
            "0";

        buyPriceElement.textContent =
            "0.00";

        profitLossElement.textContent =
            "0.00";

        profitLossPercentElement.textContent =
            "0.00%";

        currentValueElement.textContent =
            "₹0.00";

        transactionHistoryElement.innerHTML =
            "";

        updateOrderValue();

        alert(
            "Portfolio has been reset!"
        );
    }
);


// ==============================
// TIMEFRAME
// ==============================

timeframeElement.addEventListener(
    "change",
    function () {

        startCandleTimer();

        console.log(
            "Timeframe changed to:",
            timeframeElement.value,
            "minutes"
        );
    }
);


// ==============================
// AUTO UPDATE
// ==============================

autoUpdateElement.addEventListener(
    "change",
    function () {

        if (
            autoUpdateElement.checked
        ) {

            startCandleTimer();

        } else {

            stopCandleTimer();
        }
    }
);


// ==============================
// QUANTITY
// ==============================

quantityElement.addEventListener(
    "input",
    function () {

        updateOrderValue();
    }
);


// ==============================
// SUPPORT / RESISTANCE TOGGLE
// ==============================

if (showLevelsElement) {

    showLevelsElement.addEventListener(
        "change",
        function () {

            renderChart();
        }
    );
}


// ==============================
// MOVING AVERAGE TOGGLE
// ==============================

if (showMAElement) {

    showMAElement.addEventListener(
        "change",
        function () {

            renderChart();
        }
    );
}


// ==============================
// ZOOM BUTTONS
// ==============================

const zoomInButton =
    document.getElementById("zoomInButton");

const zoomOutButton =
    document.getElementById("zoomOutButton");

const resetZoomButton =
    document.getElementById("resetZoomButton");


if (zoomInButton) {

    zoomInButton.addEventListener(
        "click",
        function () {

            zoomIn();
        }
    );
}


if (zoomOutButton) {

    zoomOutButton.addEventListener(
        "click",
        function () {

            zoomOut();
        }
    );
}


if (resetZoomButton) {

    resetZoomButton.addEventListener(
        "click",
        function () {

            resetZoom();
        }
    );
}


// ==============================
// INITIAL LOAD
// ==============================

loadTradingData();

loadTransactionHistory();

loadCandles();