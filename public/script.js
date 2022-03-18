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