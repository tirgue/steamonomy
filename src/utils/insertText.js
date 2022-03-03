module.exports = (text, node, color = "white") => {
    const span = document.createElement("span");
    span.innerHTML = text;
    span.style = `
        display: block;
        text-align: end;
        font-weight: bold;
        color: ${color};
    `;
    node.parentNode.appendChild(span);
};
