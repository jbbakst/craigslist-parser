const express = require('express');
const app = express();
const request = require('request');
const cheerio = require('cheerio');
const _ = require('lodash');

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', (req, res) => {
    const query = req.query;
    const craigslistUrl = query.craigslistUrl;

    if (!craigslistUrl) {
        res.status(400).end();
        return;
    }

    request(craigslistUrl, (err, response) => {
        const $ = cheerio.load(response.body);

        const title = $('span#titletextonly').text();

        const attributeElements = $('span.shared-line-bubble');
        const bedBathAttributes = attributeElements[0].children;
        const numBedrooms = parseFloat($(bedBathAttributes[0]).text(), 10);
        const numBathrooms = parseFloat($(bedBathAttributes[2]).text(), 10);

        const sqFeet = $(attributeElements[1].children[0]).text()

        const priceText = $('span.price').text();
        const price = parseFloat(priceText.substr(1), 10);

        const neighborhoodString = $($('small')[0]).text().trim();
        const neighborhood = neighborhoodString.substr(1, neighborhoodString.length - 2);

        const attrGroup = $('.attrgroup')[1].children;
        const attributes = _.compact(_.map(attrGroup, group => $(group).text().trim()));

        const description = $('#postingbody').text().trim();

        const imageListMatches = response.body.match(/imgList = (\[.*\])/);
        const imageList = JSON.parse(imageListMatches[1])

        const map = $('#map');
        const latitude = map.attr('data-latitude');
        const longitude = map.attr('data-longitude');
        const location = {latitude, longitude};

        res.status(200).json({
            title,
            numBedrooms,
            numBathrooms,
            sqFeet,
            price,
            neighborhood,
            attributes,
            description,
            imageList,
            location,
        });
    });
});

app.listen(process.env.PORT || 8080, () => {
    console.log('Listening on port 8080');
});
