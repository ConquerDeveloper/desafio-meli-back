const express = require('express');
const axios = require('axios');
const app = express();

const cors = require('cors');

app.get('/api/item/:id', cors(), function (req, res) {
    const id = req.params.id;
    let endpoints = [`https://api.mercadolibre.com/items/${id}`, `https://api.mercadolibre.com/items/${id}/description`];
    axios.all(endpoints.map((endpoint) => axios.get(endpoint))).then((data) => {
        const dataGeneral = data[0].data;
        const dataDescription = data[1].data;
        if (data[0].status === 200) {
            axios.get(`https://api.mercadolibre.com/categories/${dataGeneral?.category_id}`).then((resp) => {
                const adaptedResponse = {
                    author: {
                        name: null,
                        lastname: null,
                    },
                    items: {
                        id: dataGeneral?.id,
                        title: dataGeneral?.title,
                        price: {
                            currency: dataGeneral?.currency_id,
                            amount: dataGeneral?.available_quantity,
                            decimals: dataGeneral?.price
                        },
                        picture: dataGeneral?.pictures[0]?.secure_url,
                        condition: dataGeneral?.condition,
                        free_shipping: dataGeneral?.shipping?.free_shipping,
                        sold_quantity: dataGeneral?.sold_quantity,
                        description: dataDescription?.plain_text,
                        categories: [{id: resp.data.id, name: resp.data.name}]
                    }
                };
                return res.send(adaptedResponse);
            });
        }
        return null;
    }).catch(console.error);
});

app.get(`/api/items`, cors(), function (req, res) {
    const query = req.query.q;
    axios.get(`https://api.mercadolibre.com/sites/MLA/search?q=:${query}`).then((data) => {
        if (data.status === 200) {
            const jsonResponse = data.data;
            let responseArray = []
            jsonResponse.results.length > 0 && jsonResponse.results.slice(0, 4).map((item) => {
                const adaptedResponse = {
                    author: {
                        name: item?.seller?.eshop?.nick_name,
                        lastname: item?.seller?.eshop?.nick_name
                    },
                    items: [
                        {
                            id: item?.id,
                            title: item?.title,
                            price: {
                                currency: item?.currency_id,
                                amount: item?.prices[0]?.amount,
                                decimals: item?.price,
                            },
                            picture: item?.thumbnail,
                            condition: item?.condition,
                            free_shipping: item?.shipping?.free_shipping
                        }
                    ]
                };
                responseArray.push(adaptedResponse);
            })
            const categories = jsonResponse.available_filters.length > 0 && jsonResponse.available_filters.filter((item) => item.id === 'category');
            const sortedCategories = categories.sort((a, b) => parseFloat(b.results) - parseFloat(a.results));
            responseArray.map((item) => item.categories = sortedCategories[0]?.values);
            return res.send(responseArray);
        }
        return null;
    }).catch(console.error);
});

module.exports = app;
