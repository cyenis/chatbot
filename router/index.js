const request = require('request');

const baseUrl = 'http://8fa24ba1.ngrok.io/adidas';

function checkStock(productName, size, cb) {
  let url = `${baseUrl}/stock`;
  let params = {
    url,
    method: 'GET',
    qs: {
      productName,
      size
    },
    json: true
  };

  request(params, (err, resp) => {
    let stores = (!err && resp && resp.body && Array.isArray(resp.body) && resp.body.length)
      ? resp.body : [];
    stores = stores.map((elem) => {
      return {
        store_id: elem.store.code,
        store_location: elem.store.location,
        product_id: elem.product.code,
        product_name: elem.product.name,
        store_name: elem.store.name,
        imageUrl: elem.product.url,
        stock: elem.quantity,
        timerange: ['19:30', '16:30', '15:30']
      }
    });
    stores = stores.filter((store) => {
      return store.stock ? true : false;
    })
    cb(stores);
  });
}

function arrangeAppointment(productId, hourOfDay, storeId, cb) {
  let body = {
    productId,
    hourOfDay,
    storeId,
    dayOfWeek: 'MONDAY'
  };

  let url = `${baseUrl}/appointment`;

  let params = {
    url,
    method: 'POST',
    body,
    json: true
  }

  request(params, (err, resp) => {
    let appointmentId = (!err && resp && resp.body && resp.body.id)
      ? resp.body.id : 0;

    cb(appointmentId);
  })
}

function recognizeSneaker(imageUrl, cb) {
  let body = {
    url: imageUrl
  };

  let url = `https://southcentralus.api.cognitive.microsoft.com/customvision/v1.1/Prediction/d89ea88a-b51b-4b2d-af9a-2bbc2117c143/image?iterationId=202628a5-25b4-400f-8086-b93c94ac50bf`;

  let params = {
    url,
    method: 'POST',
    headers: {
      'Prediction-Key': '464da760367341d4bcde3d1e9e33dff2',
      'Content-Type': 'application/json'
    },
    body,
    json: true
  }

  request(params, (err, resp) => {
    let predictions = (!err && resp && resp.body && resp.body.id)
      ? resp.body.Predictions : [];
    
    let name = (predictions.length > 0) ? predictions[0].Tag : '';

    cb(name);
  })
}

module.exports = {
  checkStock,
  arrangeAppointment,
  recognizeSneaker
};
