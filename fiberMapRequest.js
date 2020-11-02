const axios = require('axios');

module.exports.getRegions = async () => {
  const regions = [];
  response = await axios.get('https://fibermap.it/api/region/list', {
      headers: {
          'Content-Type': 'application/json'
      }
  });
  response.data.data.forEach((column) => 
      column.data.forEach(
          (zone) => 
              zone.data.forEach((region) => regions.push(region))));
  
  console.log(regions);
  return regions;
};

module.exports.getProvinces = async (regionId) => {
  const provinces = [];
  response = await axios.get(`https://fibermap.it/api/region/${regionId}/provinces`, {
      headers: {
          'Content-Type': 'application/json'
      }
  });
  response.data.data.forEach((province) => provinces.push(province));
  
  console.log(provinces);
  return provinces;
};

module.exports.getCities = async (provinceId) => {
  const cities = [];
  response = await axios.get(`https://fibermap.it/api/province/${provinceId}/cities`, {
      headers: {
          'Content-Type': 'application/json'
      }
  });
  response.data.data.forEach((city) => cities.push(city));
  
  console.log(cities);
  return cities;
};

module.exports.getStreets = async (cityId) => {
  const streets = [];
  response = await axios.get(`https://fibermap.it/api/city/${cityId}/streets`, {
      headers: {
          'Content-Type': 'application/json'
      }
  });
  response.data.data.forEach((street) => streets.push(street));
  
  console.log(streets);
  return streets;
};
