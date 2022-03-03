module.exports = () => {
    const table = document.getElementById("searchResultsRows");

    const elements = Array.from(table.childNodes.values())
        .map((child) => {
            try {
                const element = child.childNodes[1]?.getElementsByClassName(
                    "market_listing_item_name_block"
                )[0]?.childNodes[1];

                if (!element) return undefined;

                const name = element?.innerHTML.replaceAll("&amp;", "&");

                return { element, name };
            } catch (error) {
                return undefined;
            }
        })
        .filter((i) => i !== undefined);

    return elements;
};
