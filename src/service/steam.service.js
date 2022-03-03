const axios = require("axios");
var Cheerio = require("cheerio");

class SteamService {
    static getMarketItem(appid, hashName) {
        return new Promise((resolve, reject) => {
            const url =
                "https://steamcommunity.com/market/listings/" +
                appid +
                "/" +
                encodeURIComponent(hashName);

            axios
                .get(url)
                .then((response) => {
                    const body = response.data;
                    var $ = Cheerio.load(body);
                    if (
                        $(".market_listing_table_message") &&
                        $(".market_listing_table_message").text().trim() ==
                            "There are no listings for marketItem item."
                    ) {
                        return reject(
                            new Error(
                                "There are no listings for marketItem item."
                            )
                        );
                    }

                    const marketItem = {};

                    marketItem._country = "US";
                    var match = body.match(/var g_strCountryCode = "([^"]+)";/);
                    if (match) {
                        marketItem._country = match[1];
                    }

                    marketItem._language = "english";
                    match = body.match(/var g_strLanguage = "([^"]+)";/);
                    if (match) {
                        marketItem._language = match[1];
                    }

                    marketItem.commodity = false;
                    match = body.match(
                        /Market_LoadOrderSpread\(\s*(\d+)\s*\);/
                    );
                    if (match) {
                        marketItem.commodity = true;
                        marketItem.commodityID = parseInt(match[1], 10);
                    }

                    marketItem.medianSalePrices = null;
                    match = body.match(/var line1=([^;]+);/);
                    if (match) {
                        try {
                            marketItem.medianSalePrices = JSON.parse(match[1]);
                            marketItem.medianSalePrices =
                                marketItem.medianSalePrices.map(function (
                                    item
                                ) {
                                    return {
                                        hour: new Date(item[0]),
                                        price: item[1],
                                        quantity: parseInt(item[2], 10),
                                    };
                                });
                        } catch (e) {
                            // ignore
                        }
                    }

                    marketItem.firstAsset = null;
                    marketItem.assets = null;
                    match = body.match(/var g_rgAssets = (.*);/);
                    if (match) {
                        try {
                            marketItem.assets = JSON.parse(match[1]);
                            marketItem.assets = marketItem.assets[appid];
                            marketItem.assets =
                                marketItem.assets[
                                    Object.keys(marketItem.assets)[0]
                                ];
                            marketItem.firstAsset =
                                marketItem.assets[
                                    Object.keys(marketItem.assets)[0]
                                ];
                        } catch (e) {
                            // ignore
                        }
                    }

                    marketItem.quantity = 0;
                    marketItem.lowestPrice = 0;

                    resolve(marketItem);
                })
                .catch((err) => reject(err));
        });
    }

    static updatePrice(marketItem, currency) {
        if (marketItem.commodity) {
            return this.updatePriceForCommodity(marketItem, currency);
        } else {
            // return this.updatePriceForNonCommodity(marketItem, currency);
        }
    }

    static updatePriceForCommodity(marketItem, currency) {
        return new Promise((resolve, reject) => {
            if (!marketItem.commodity) {
                throw new Error("Cannot update price for non-commodity item");
            }

            const url =
                "https://steamcommunity.com/market/itemordershistogram?country=US&language=english&currency=" +
                currency +
                "&item_nameid=" +
                marketItem.commodityID;
            axios
                .get(url)
                .then((response) => {
                    const body = response.data;
                    var match = (body.sell_order_summary || "").match(
                        /<span class="market_commodity_orders_header_promote">(\d+)<\/span>/
                    );
                    if (match) {
                        marketItem.quantity = parseInt(match[1], 10);
                    }

                    marketItem.buyQuantity = 0;
                    match = (body.buy_order_summary || "").match(
                        /<span class="market_commodity_orders_header_promote">(\d+)<\/span>/
                    );
                    if (match) {
                        marketItem.buyQuantity = parseInt(match[1], 10);
                    }

                    marketItem.lowestPrice = parseInt(
                        body.lowest_sell_order,
                        10
                    );
                    marketItem.highestBuyOrder = parseInt(
                        body.highest_buy_order,
                        10
                    );

                    resolve(marketItem);
                })
                .catch((err) => reject(err));
        });
    }
}

module.exports = SteamService;
