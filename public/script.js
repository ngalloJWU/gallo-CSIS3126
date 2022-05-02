const addSave=(userId,productId)=>{
    let curClass = document.getElementById('savePost').className
    switch(curClass){
        case'fa-regular fa-bookmark':
            document.getElementById('savePost').className ='fa-solid fa-bookmark';
            break;
        case'fa-solid fa-bookmark':
            document.getElementById('savePost').className='fa-regular fa-bookmark';
            break;
    }
    let data={
        user:userId,
        product:productId
    }
    $.ajax({
        method: "PUT",
        url: '/addSave',
        dataType:'json',
        data: data
     });
}

//Switch Between Listings and Saved Items on Account Page
const getSaved=()=>{
    savedDiv=document.getElementById('savedItems')
    itemsDiv=document.getElementById('myItems')
    saveBtn=document.getElementById('savedItemsBtn')
    itemsBtn=document.getElementById('myItemsBtn')

    itemsBtn.className='btn btn-outline-success w-25'
    saveBtn.className='btn btn-success w-25'
    itemsDiv.className = 'container mt-3 invis'
    savedDiv.className = 'container mt-3'
}

const getListings=()=>{
    savedDiv=document.getElementById('savedItems')
    itemsDiv=document.getElementById('myItems')
    saveBtn=document.getElementById('savedItemsBtn')
    itemsBtn=document.getElementById('myItemsBtn')

    itemsBtn.className='btn btn-success w-25'
    saveBtn.className='btn btn-outline-success w-25'
    itemsDiv.className = 'container mt-3'
    savedDiv.className = 'container mt-3 invis'
}

const editAccount=()=>{
    document.getElementById('accountInfo').className="w-25 invis"
    document.getElementById('editAccountInfo').className="w-25"
}