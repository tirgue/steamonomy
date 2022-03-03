const extractListing = require("./src/utils/extractListing");
const insertText = require("./src/utils/insertText");
const steamService = require("./src/service/steam.service");

const load = () => {
    const appId = window.location.href.match("appid=([0-9]*)")[1];

    const listing = extractListing();

    listing.forEach(({ name, element }) => {
        steamService.getMarketItem(appId, name, 3).then((item) => {
            steamService.updatePrice(item, 3).then((item) => {
                const ratio =
                    item.lowestPrice / 1.15 / item.highestBuyOrder - 1;
                const percent = ratio * 100;
                const percentRounded = Math.round(percent * 100) / 100;
                insertText(
                    `${percentRounded} %`,
                    element,
                    percent > 0
                        ? percent > 5
                            ? "#4caf50"
                            : "#ff9800"
                        : "#f44336"
                );
            });
        });
    });
};

const button = document.createElement("button");
button.innerHTML = "LOAD";
button.style = `
    float: right;
    font-size: 3em;
    margin-right: -150px;
    margin-top: -90px;
`;
button.onclick = load;
document.getElementById("searchResults_ctn").parentNode.appendChild(button);
