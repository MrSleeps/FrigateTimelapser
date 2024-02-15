/*!
 * Lightbox for Bootstrap 5 v1.8.3 (https://trvswgnr.github.io/bs5-lightbox/)
 * Copyright 2023 Travis Aaron Wagner (https://github.com/trvswgnr/)
 * Licensed under MIT (https://github.com/trvswgnr/bs5-lightbox/blob/main/LICENSE)
*/!function(){"use strict";var t={d:function(e,s){for(var a in s)t.o(s,a)&&!t.o(e,a)&&Object.defineProperty(e,a,{enumerable:!0,get:s[a]})},o:function(t,e){return Object.prototype.hasOwnProperty.call(t,e)}},e={};t.d(e,{default:function(){return i}});var s=window.bootstrap;const a={Modal:s.Modal,Carousel:s.Carousel};class o{constructor(t){let e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};this.hash=this.randomHash(),this.settings=Object.assign(Object.assign(Object.assign({},a.Modal.Default),a.Carousel.Default),{interval:!1,target:'[data-toggle="lightbox"]',gallery:"",size:"xl",constrain:!0}),this.settings=Object.assign(Object.assign({},this.settings),e),this.modalOptions=(()=>this.setOptionsFromSettings(a.Modal.Default))(),this.carouselOptions=(()=>this.setOptionsFromSettings(a.Carousel.Default))(),"string"==typeof t&&(this.settings.target=t,t=document.querySelector(this.settings.target)),this.el=t,this.type=t.dataset.type||"",this.src=this.getSrc(t),this.sources=this.getGalleryItems(),this.createCarousel(),this.createModal()}show(){document.body.appendChild(this.modalElement),this.modal.show()}hide(){this.modal.hide()}setOptionsFromSettings(t){return Object.keys(t).reduce(((t,e)=>Object.assign(t,{[e]:this.settings[e]})),{})}getSrc(t){let e=t.dataset.src||t.dataset.remote||t.href||"http://via.placeholder.com/1600x900";if("html"===t.dataset.type)return e;/\:\/\//.test(e)||(e=window.location.origin+e);const s=new URL(e);return(t.dataset.footer||t.dataset.caption)&&s.searchParams.set("caption",t.dataset.footer||t.dataset.caption),s.toString()}getGalleryItems(){let t;if(this.settings.gallery){if(Array.isArray(this.settings.gallery))return this.settings.gallery;t=this.settings.gallery}else this.el.dataset.gallery&&(t=this.el.dataset.gallery);return t?[...new Set(Array.from(document.querySelectorAll('[data-gallery="'.concat(t,'"]')),(t=>"".concat(t.dataset.type?t.dataset.type:"").concat(this.getSrc(t)))))]:["".concat(this.type?this.type:"").concat(this.src)]}getYoutubeId(t){if(!t)return!1;const e=t.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);return!(!e||11!==e[2].length)&&e[2]}getYoutubeLink(t){const e=this.getYoutubeId(t);if(!e)return!1;const s=t.split("?");let a=s.length>1?"?"+s[1]:"";return"https://www.youtube.com/embed/".concat(e).concat(a)}getInstagramEmbed(t){if(/instagram/.test(t))return t+=/\/embed$/.test(t)?"":"/embed",'<iframe src="'.concat(t,'" class="start-50 translate-middle-x" style="max-width: 500px" frameborder="0" scrolling="no" allowtransparency="true"></iframe>')}isEmbed(t){const e=new RegExp("("+o.allowedEmbedTypes.join("|")+")").test(t),s=/\.(png|jpe?g|gif|svg|webp)/i.test(t)||"image"===this.el.dataset.type;return e||!s}createCarousel(){const t=document.createElement("template"),e=o.allowedMediaTypes.join("|"),s=this.sources.map(((t,s)=>{t=t.replace(/\/$/,"");const a=new RegExp("^(".concat(e,")"),"i"),o=/^html/.test(t),i=/^image/.test(t);a.test(t)&&(t=t.replace(a,""));const n=this.settings.constrain?"mw-100 mh-100 h-auto w-auto m-auto top-0 end-0 bottom-0 start-0":"h-100 w-100",l=new URLSearchParams(t.split("?")[1]);let r="",c=t;if(l.get("caption")){try{c=new URL(t),c.searchParams.delete("caption"),c=c.toString()}catch(e){c=t}r='<p class="lightbox-caption m-0 p-2 text-center text-white small"><em>'.concat(l.get("caption"),"</em></p>")}let d='<img src="'.concat(c,'" class="d-block ').concat(n,' img-fluid" style="z-index: 1; object-fit: contain;" />'),h="";const u=this.getInstagramEmbed(t),m=this.getYoutubeLink(t);this.isEmbed(t)&&!i&&(m&&(t=m,h='title="YouTube video player" frameborder="0" allow="accelerometer autoplay clipboard-write encrypted-media gyroscope picture-in-picture"'),d=u||'<iframe src="'.concat(t,'" ').concat(h," allowfullscreen></iframe>")),o&&(d=t);return'\n\t\t\t\t<div class="carousel-item '.concat(s?"":"active",'" style="min-height: 100px">\n\t\t\t\t\t').concat('<div class="position-absolute top-50 start-50 translate-middle text-white"><div class="spinner-border" style="width: 3rem height: 3rem" role="status"></div></div>','\n\t\t\t\t\t<div class="ratio ratio-16x9" style="background-color: #000;">').concat(d,"</div>\n\t\t\t\t\t").concat(r,"\n\t\t\t\t</div>")})).join(""),i=this.sources.length<2?"":'\n\t\t\t<button id="#lightboxCarousel-'.concat(this.hash,'-prev" class="carousel-control carousel-control-prev h-75 m-auto" type="button" data-bs-target="#lightboxCarousel-').concat(this.hash,'" data-bs-slide="prev">\n\t\t\t\t<span class="carousel-control-prev-icon" aria-hidden="true"></span>\n\t\t\t\t<span class="visually-hidden">Previous</span>\n\t\t\t</button>\n\t\t\t<button id="#lightboxCarousel-').concat(this.hash,'-next" class="carousel-control carousel-control-next h-75 m-auto" type="button" data-bs-target="#lightboxCarousel-').concat(this.hash,'" data-bs-slide="next">\n\t\t\t\t<span class="carousel-control-next-icon" aria-hidden="true"></span>\n\t\t\t\t<span class="visually-hidden">Next</span>\n\t\t\t</button>');let n="lightbox-carousel carousel slide";"fullscreen"===this.settings.size&&(n+=" position-absolute w-100 translate-middle top-50 start-50");const l='\n\t\t\t<div id="lightboxCarousel-'.concat(this.hash,'" class="').concat(n,'" data-bs-ride="carousel" data-bs-interval="').concat(this.carouselOptions.interval,'">\n\t\t\t\t<div class="carousel-inner">\n\t\t\t\t\t').concat(s,"\n\t\t\t\t</div>\n\t\t\t\t").concat(i,"\n\t\t\t</div>");t.innerHTML=l.trim(),this.carouselElement=t.content.firstChild;const r=Object.assign(Object.assign({},this.carouselOptions),{keyboard:!1});this.carousel=new a.Carousel(this.carouselElement,r);const c=this.type&&"image"!==this.type?this.type+this.src:this.src;return this.carousel.to(this.findGalleryItemIndex(this.sources,c)),!0===this.carouselOptions.keyboard&&document.addEventListener("keydown",(t=>{if("ArrowLeft"===t.code){const t=document.getElementById("#lightboxCarousel-".concat(this.hash,"-prev"));return t&&t.click(),!1}if("ArrowRight"===t.code){const t=document.getElementById("#lightboxCarousel-".concat(this.hash,"-next"));return t&&t.click(),!1}})),this.carousel}findGalleryItemIndex(t,e){let s=0;for(const a of t){if(a.includes(e))return s;s++}return 0}createModal(){const t=document.createElement("template"),e='\n\t\t\t<div class="modal lightbox fade" id="lightboxModal-'.concat(this.hash,'" tabindex="-1" aria-hidden="true">\n\t\t\t\t<div class="modal-dialog modal-dialog-centered modal-').concat(this.settings.size,'">\n\t\t\t\t\t<div class="modal-content border-0 bg-transparent">\n\t\t\t\t\t\t<div class="modal-body p-0">\n\t\t\t\t\t\t\t<button type="button" class="btn-close position-absolute top-0 end-0 p-3" data-bs-dismiss="modal" aria-label="Close" style="z-index: 2; background: none;">').concat('<svg xmlns="http://www.w3.org/2000/svg" style="position: relative; top: -5px;" viewBox="0 0 16 16" fill="#fff"><path d="M.293.293a1 1 0 011.414 0L8 6.586 14.293.293a1 1 0 111.414 1.414L9.414 8l6.293 6.293a1 1 0 01-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 01-1.414-1.414L6.586 8 .293 1.707a1 1 0 010-1.414z"/></svg>',"</button>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>");return t.innerHTML=e.trim(),this.modalElement=t.content.firstChild,this.modalElement.querySelector(".modal-body").appendChild(this.carouselElement),this.modalElement.addEventListener("hidden.bs.modal",(()=>this.modalElement.remove())),this.modalElement.querySelector("[data-bs-dismiss]").addEventListener("click",(()=>this.modal.hide())),this.modal=new a.Modal(this.modalElement,this.modalOptions),this.modal}randomHash(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:8;return Array.from({length:t},(()=>Math.floor(36*Math.random()).toString(36))).join("")}}o.allowedEmbedTypes=["embed","youtube","vimeo","instagram","url"],o.allowedMediaTypes=[...o.allowedEmbedTypes,"image","html"],o.defaultSelector='[data-toggle="lightbox"]',o.initialize=function(t){t.preventDefault();new o(this).show()},document.querySelectorAll(o.defaultSelector).forEach((t=>t.addEventListener("click",o.initialize))),"undefined"!=typeof window&&window.bootstrap&&(window.bootstrap.Lightbox=o);var i=o;window.Lightbox=e.default}();
//# sourceMappingURL=index.bundle.min.js.map

/*!
  * notification (https://github.com/amaterasusan/notification/tree/master)
  * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
  */

function Notification(opts) {
    const defaultOpts = {
      position: 'top-right',
      duration: 4000,
    };
    opts = Object.assign({}, defaultOpts, opts);
    opts.duration = parseInt(opts.duration) || 0;
  
    const timeouts = [];
  
    // selectors
    const classMainSelector = 'notification-container';
    const classPopup = 'notification';
    const animationInClass = 'animation-slide-in';
    const animationOutClass = 'animation-slide-out';
    const animationFadeInClass = 'animation-fade-in';
    const animationFadeOutClass = 'animation-fade-out';
    const titleSelector = '.notification-title';
    const descSelector = '.notification-desc';
    const closeSelector = '.notification-close';
    const actionButSelector = '.notification-action';
    const cancelButSelector = '.notification-cancel';
    const overlayClass = 'overlay';
    const overlaySelector = `.${overlayClass}`;
  
    // class, defaultTitle and defaultMessage
    const dataByType = {
      dialog: {
        classType: 'notification-default',
        defaultTitle: 'Confirm',
        defaultMessage: 'Default Confirm message',
      },
      info: {
        classType: 'notification-info',
        defaultTitle: 'Info',
        defaultMessage: 'default Info',
      },
      success: {
        classType: 'notification-success',
        defaultTitle: 'Success',
        defaultMessage: 'default Success',
      },
      warning: {
        classType: 'notification-warning',
        defaultTitle: 'Warning',
        defaultMessage: 'default Warning',
      },
      error: {
        classType: 'notification-error',
        defaultTitle: 'Error',
        defaultMessage: 'An error has occurred',
      },
    };
  
    const setPosition = (newPosition) => {
      opts.position = newPosition;
    };
  
    const tempatePopup = () => {
      return `
      <a class="notification-close">
        <svg viewbox="0 0 50 50">
          <path class="close-x" d="M 10,10 L 30,30 M 30,10 L 10,30" />
        </svg>
      </a>
      <div class="notification-body">
        <div class="notification-icon"></div>
        <div class="notification-content">
          <div class="notification-title"></div>
          <div class="notification-desc"></div>
        </div>
      </div>`;
    };
  
    const dialogButtons = () => {
      return `<div class="notification-buttons">
      <span class="notification-button notification-cancel"></span>
      <span class="notification-button notification-action"></span>
      </div>`;
    };
  
    const createMainContainer = (position) => {
      let container = document.querySelector(`.${classMainSelector}.${position}`);
  
      if (!container) {
        container = document.createElement('div');
        container.classList = classMainSelector + ' ' + position;
        document.body.appendChild(container);
      }
  
      return container;
    };
  
    const createPopup = (type) => {
      const container = createMainContainer(opts.position);
  
      const elPopup = document.createElement('div');
  
      // add classes
      elPopup.classList.add(classPopup);
      elPopup.classList.add(opts.position === 'center' ? animationFadeInClass : animationInClass);
      elPopup.classList.add(dataByType[type].classType);
  
      // insert template in element
      elPopup.insertAdjacentHTML('beforeend', tempatePopup());
  
      // add buttons if confirm dialog
      if (type === 'dialog') {
        elPopup.insertAdjacentHTML('beforeend', dialogButtons());
        if (!document.querySelector(overlaySelector)) {
          const overlayEl = document.createElement('div');
          overlayEl.classList.add(overlayClass);
          document.body.appendChild(overlayEl);
        }
  
        document.querySelector(overlaySelector).classList.add('active');
      }
  
      // add element to container in the required sequence
      if (opts.position.includes('bottom')) {
        container.prepend(elPopup);
      } else {
        container.appendChild(elPopup);
      }
  
      return elPopup;
    };
  
    const setButtonsEvent = (elPopup, callback = null) => {
      const elAction = elPopup.querySelector(actionButSelector);
      elAction.addEventListener(
        'click',
        function handlerAction(event) {
          event.stopPropagation();
          event.preventDefault();
          hidePopUp(elPopup);
  
          elAction.removeEventListener('click', handlerAction, false);
          if (callback) {
            return callback('ok');
          }
          return false;
        },
        false
      );
  
      const elCancel = elPopup.querySelector(cancelButSelector);
      elCancel.addEventListener(
        'click',
        function handlerCancel(event) {
          event.stopPropagation();
          event.preventDefault();
          hidePopUp(elPopup);
  
          elCancel.removeEventListener('click', handlerCancel, false);
          if (callback) {
            return callback('cancel');
          }
          return false;
        },
        false
      );
    };
  
    const hidePopUp = (elPopup) => {
      const container = document.querySelector(`.${classMainSelector}.${opts.position}`);
  
      const firstTimeout = timeouts.shift();
      clearTimeout(firstTimeout);
  
      // change animation class
      elPopup.classList.remove(opts.position === 'center' ? animationFadeInClass : animationInClass);
  
      elPopup.classList.add(opts.position === 'center' ? animationFadeOutClass : animationOutClass);
  
      setTimeout(function () {
        if (elPopup.parentNode == container) {
          container.removeChild(elPopup);
  
          if (opts.type === 'dialog') {
            document.querySelector(overlaySelector).classList.remove('active');
          }
        }
  
        // Remove container if it empty
        if (!container.hasChildNodes()) {
          document.body.removeChild(container);
        }
      }, 500);
    };
  
    const showPopup = ({ type, title, message, callback = null } = {}) => {
      opts.type = type;
      const elPopup = createPopup(type);
  
      // set title and message to created element
      const elTitle = elPopup.querySelector(titleSelector);
      const elText = elPopup.querySelector(descSelector);
  
      const titlePopup = title || dataByType[type].defaultTitle;
      const messagePopup = message || dataByType[type].defaultMessage;
  
      elTitle.innerText = titlePopup;
      elText.innerText = messagePopup;
  
      // click event
      if (type === 'dialog') {
        // set buttons click event
        setButtonsEvent(elPopup, callback);
      } else if (opts.duration) {
        // push new timeout to timeouts array if type is not dialog
        const timeout = setTimeout(() => hidePopUp(elPopup), opts.duration);
        timeouts.push(timeout);
      }
  
      // add click event to close element
      const elClose = elPopup.querySelector(closeSelector);
      elClose.addEventListener(
        'click',
        function handlerClose(event) {
          hidePopUp(elPopup);
          elClose.removeEventListener('click', handlerClose, false);
        },
        false
      );
    };
  
    const dialog = ({ title, message, callback = null }) =>
      showPopup({ type: 'dialog', title, message, callback });
    const info = ({ title, message }) => showPopup({ type: 'info', title, message });
    const success = ({ title, message }) => showPopup({ type: 'success', title, message });
    const warning = ({ title, message }) => showPopup({ type: 'warning', title, message });
    const error = ({ title, message }) => showPopup({ type: 'error', title, message });
    return { dialog, info, success, warning, error, setPosition };
  }