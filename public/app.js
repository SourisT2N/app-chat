$(document).ready(function(){
    let Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
    });

    let socket = io('http://127.0.0.1:3000');
    let img = null
    let div = null;
    $('#action_menu_btn').click(function(){
        $('.action_menu').toggle();
    });

    $('#login').submit(function(e) {
        e.preventDefault();
        let name = $('input[name="fullname"]').val();
        let img = $('.icon-user.active').attr('src');
        if(!name || !img)
        {
            Toast.fire({
                icon: 'error',
                title: 'Check name and icon again.'
            });
            return;
        }
        socket.emit('create-user',{'name': name,'img': img});
    });

    $('.icon-user').click(function() {
        if(img != null)
            $(img).removeClass('active border-success');
        img = this;
        $(this).addClass('active border-success');
    });

    socket.on('res-user',function(data){
        $('.login-page').fadeOut(500,() => {
            $('.login-page').remove();
        });
        $('body').html(renderHtml());
        Toast.fire({
            icon: 'success',
            title: data.message
        });
        $('.container-fluid.h-100').fadeIn(500);
        $('textarea[name="mess"]').emojioneArea();
    });
    socket.on('data-user',function(data){
        let html = `<li class="active">
							<div class="d-flex bd-highlight" data-id="cmn">
								<div class="img_cont">
									<img src="https://cdn4.vectorstock.com/i/1000x1000/18/23/community-icon-vector-15041823.jpg" class="rounded-circle user_img">
								</div>
								<div class="user_info">
									<span>Community</span>
								</div>
							</div>
						</li>`;
        data.users.forEach((val) =>
            html += `<li>
							<div class="d-flex bd-highlight"  data-id="${val.id}">
								<div class="img_cont">
									<img src="${val.img}" class="rounded-circle user_img">
									<span class="online_icon"></span>
								</div>
								<div class="user_info">
									<span>${val.name}</span>
								</div>
							</div>
						</li>`
            
        );
        $('.contacts').html(html);
        div = $('.contacts li.active');
    });

    $('body').on("keyup",'.emojionearea-editor', function(event) {
          if (event.keyCode === 13 && !event.shiftKey && $(this).text()) {
            event.preventDefault();
            this.blur();
            document.querySelector(".send_btn").click();
          }
    });

    $('body').on('click','.send_btn#community',() => {
        let value = $('textarea').val();
        if(!value.trim())
            return;
        socket.emit('send-message',{id: "cmn","message":value});
        $('textarea').val('');
        $('.emojionearea-editor').text('');
    });

    socket.on('res-message',(data) => {
        let html = userSend(data);
        $(`.card-body.msg_card_body>#${data.idRoom}`).append(html);
        $(`.card-body.msg_card_body`).scrollTop($(`.card-body.msg_card_body #${data.idRoom}`).height());
    });
    
    socket.on('res-all-message',(data) => {
        let html = userReceive(data);
        $(`.card-body.msg_card_body #${data.idRoom}`).append(html);
        $('.lds-ellipsis').remove();
        if($(`.contacts li.active div.d-flex.bd-highlight[data-id='${data.idRoom}']`).length == 0)
            $(`.contacts li div.d-flex.bd-highlight[data-id='${data.idRoom}']`).append(`<i class="fas fa-exclamation icon-notify"></i>`);
    });

    $('body').on('click','.contacts li:not(.active)', function(){
        let id = $(this).find('div').attr('data-id');
        div.removeClass('active');
        div = $(this);
        div.addClass('active');
        if(id == 'cmn')
        {
            $('.send_btn').attr('id','community');
            $('.send_btn').attr('data-id','');
            $('.card-header.msg_head img').attr('src','https://cdn4.vectorstock.com/i/1000x1000/18/23/community-icon-vector-15041823.jpg');
            $('.user_info #name-info').text('');
            $('.card-body.msg_card_body>div').text('');
            $('.card-body.msg_card_body>div').attr('id',id);
            $('.card-body.msg_card_body>#loading').attr('data-id',id);
        }
        else
            socket.emit('get-user',id);
        $(`.contacts li div.d-flex.bd-highlight[data-id='${id}'] .icon-notify`).remove();
        socket.emit('get-list-message',id);
    });

    socket.on('info-user',(data) => {
        let user = data.user;
        $('.send_btn').attr('id','private');
        $('.send_btn').attr('data-id',user.id);
        $('.card-header.msg_head img').attr('src',user.img);
        $('.user_info #name-info').text(user.name);
        $('.card-body.msg_card_body>div').text('');
        $('.card-body.msg_card_body>div').attr('id',user.id);
        $('.card-body.msg_card_body>#loading').attr('data-id',user.id);
    });

    $('body').on('click','.send_btn#private',function() {
        let id = $(this).attr('data-id');
        let value = $('textarea').val();
        if(!value.trim())
            return;
        $('textarea').val('');
        $('.emojionearea-editor').text('');
        socket.emit('private-send',{"id": id,"message": value});
    });

    socket.on('res-list-message',(data) => {
        let html = data.data.map((val) => {
            if(val.user.id == data.idUser)
                return userSend(val);
            return userReceive(val);
        }).join('');
        $(`.card-body.msg_card_body #${data.idRoom}`).html(html);
        $(`.card-body.msg_card_body`).scrollTop($(`.card-body.msg_card_body #${data.idRoom}`).height());
    });

    $('body').on('keyup','.emojionearea-editor',function() {
        let idRoom = $('.card-body.msg_card_body>div').attr('id');
        socket.emit('req-change',idRoom);
    });

    socket.on('res-change',(data) => {
        console.log(data);
        let html = `<div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div>`;
        if($(`.card-body.msg_card_body #loading[data-id="${data}"] .lds-ellipsis`).length == 0)
            $(`.card-body.msg_card_body #loading[data-id="${data}"]`).html(html);
    });
});

function renderHtml()
{
    let html = `
    <div class="container-fluid h-100" style="display:none">
        <div class="row justify-content-center h-100">
            <div class="col-md-4 col-xl-3 chat"><div class="card mb-sm-3 mb-md-0 contacts_card">
                <div class="card-header">
                    <div class="input-group">
                        <input type="text" placeholder="Search..." name="" class="form-control search">
                        <div class="input-group-prepend">
                            <span class="input-group-text search_btn"><i class="fas fa-search"></i></span>
                        </div>
                    </div>
                </div>
                <div class="card-body contacts_body">
                    <ui class="contacts">
                    </ui>
                </div>
                <div class="card-footer"></div>
            </div></div>
            <div class="col-md-8 col-xl-6 chat">
                <div class="card">
                    <div class="card-header msg_head">
                        <div class="d-flex bd-highlight">
                            <div class="img_cont">
                                <img src="https://cdn4.vectorstock.com/i/1000x1000/18/23/community-icon-vector-15041823.jpg" class="rounded-circle user_img">
                            </div>
                            <div class="user_info">
                                <span id="name-info"></span>
                            </div>
                        </div>
                        <span id="action_menu_btn"><i class="fas fa-ellipsis-v"></i></span>
                        <div class="action_menu">
                            <ul>
                                <li><i class="fas fa-user-circle"></i> View profile</li>
                                <li><i class="fas fa-users"></i> Add to close friends</li>
                                <li><i class="fas fa-plus"></i> Add to group</li>
                                <li><i class="fas fa-ban"></i> Block</li>
                            </ul>
                        </div>
                    </div>
                    <div class="card-body msg_card_body">
                        <div id="cmn"></div>
                        <span id="loading" data-id="cmn"></span>
                    </div>
                    <div class="card-footer">
                        <div class="input-group fix">
                            <textarea name="mess" class="form-control type_msg" placeholder="Type your message..."></textarea>
                            <div class="input-group-append">
                                <button type="submit" class="input-group-text send_btn" id="community"><i class="fas fa-location-arrow"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
    return html;
}

function userSend(data)
{
    return `
    <div class="d-flex justify-content-end mb-4">
        <div class="msg_cotainer_send">
            <span>${data.message}</span>
        </div>
        <div class="img_cont_msg">
        <img src="${data.user.img}" class="rounded-circle user_img_msg">
        <span class="name-user">${data.user.name}</span>
        </div>
    </div>`;
}

function userReceive(data)
{
    return `<div class="d-flex justify-content-start mb-4">
								<div class="img_cont_msg">
									<img src="${data.user.img}" class="rounded-circle user_img_msg">
                                    <span class="name-user">${data.user.name}</span>
								</div>
								<div class="msg_cotainer">
									<span>${data.message}</span>
								</div>
							</div>`;
}