const input = document.getElementById('searchVal');
const searchBtn = document.getElementById('searchBtn')

searchBtn.addEventListener('click',()=>{
    console.log('click')
    location.href= `http://localhost:3000/products/sort?search=${input.value}`
})