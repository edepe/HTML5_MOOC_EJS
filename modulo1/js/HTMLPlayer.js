/**
 * HTML5 MOOC Player
 * https://github.com/ebarra/HTML5_MOOC_EJS
 *
 * @module HTMLPlayer
 */
var HTMLPlayer = HTMLPlayer || {};

HTMLPlayer.VERSION = '0.0.1';
HTMLPlayer.AUTHORS = 'Enrique Barra';
HTMLPlayer.URL = "https://github.com/ebarra/HTML5_MOOC_EJS";

HTMLPlayer.CORE = (function(H,$,undefined){

  var editor;
  var w;

  var init = function(options){
    editor = $("#editor");
    w = window.innerWidth;

    _inicializaEnventos();
    _loadFirstTab();
  };

  //METODOS PRIVADOS

  //Detectamos las features del browser a ver si habilitamos más opciones
  var _detectaFeaturesInicializaEventos = function(){
    //primero Subir fichero, para ello usaremos FileReader
    if(window.FileReader) {
      var fileInput = document.getElementById('fileInput');
      var fileDisplayArea = $('#editor');
      fileInput.addEventListener('change', _handle_file_input);
    } else {
      //the browser doesn't support the FileReader Object, so do this
      $("#subir").hide();
    }

    //segundo file api para descargar el fichero. Para esto usamos Blob api
    if(window.Blob) {
      $("#descargar").on("click", function(){
        _download_code("yourpage.html");
      });
    } else {
      $("#descargar").hide();
    }

    //tercero, localstorage para guardar en local
    if(window.localStorage){
      $("#guardar").on("click", function(){
        alert("Guardaremos el contenido de esta tab. Lo podrás recuperar la próxima vez que accedas. Para volver a la versión inicial haz click en 'reset'");
        var tab = $(".active").attr("title");
        localStorage.setItem(tab, $("#editor").val() );
      });
    }else{
      $("#guardar").hide();
    }
  };

  var _handle_file_input = function(e) {
    var file = fileInput.files[0];
    var textType = /text.*/;

    if (file.type.match(textType)) {
      var reader = new FileReader();

      reader.onload = function(e) {
        fileDisplayArea.val(reader.result);
        fileInput.removeEventListener('change', _handle_file_input);
        $(fileInput).val("");
        fileInput.addEventListener('change', _handle_file_input);
      }
      reader.readAsText(file);
    } else {
      fileDisplayArea.innerText = "File not supported!"
    }
  }

  var _inicializaEnventos = function(){
    _detectaFeaturesInicializaEventos();

    $( window ).resize(function() {
    	 w=window.innerWidth;
    	 if (w<600){
        	$('.caja_visor').hide();
          $("#menu").hide();
      } else {
          $('.caja_visor').show();
          $("#menu").show();
    	}
    });

    $("nav a.tab").on("click", function(){
        var local = localStorage.getItem($(this).attr("title"));
        if(local!=null){
          _mostrar(local);
        } else {
          $.get($(this).attr("title"), "text", _mostrar);
        }
        _poner_titulo($(this).attr("title"));
        $("nav a.tab").removeClass("active");
        $(this).addClass("active");
    });

    $("#actualizar").on("click", function(){
      _ejecutar(editor.val());
  	  var micontenedor = document.getElementById('cvisor');
    	if (micontenedor.style.display == "block" && w<600) {
        micontenedor.style.display = "none";
      } else{
    	  micontenedor.style.display = "block"
    	}
    });

    $(".caja_visor #cerrar").on("click", function(){
    	var micontenedor = document.getElementById('cvisor');
    	if (micontenedor.style.display == "block") {
       micontenedor.style.display = "none";
      } else{
    	  micontenedor.style.display = "block"
    	}
    });

    $(".selector").on("click", function(){
    	var mimenu = document.getElementById('menu');
    	if (mimenu.style.display == "block") {
       mimenu.style.display = "none";
      } else{
    	  mimenu.style.display = "block"
  	  }
    });

    $("#reset").on("click", function(){
        var r = confirm("Perderás tus cambios y volverás a la versión inicial. ¿Estás seguro?");
        if (r == true) {
            var tab = $(".active").attr("title");
            $.get(tab, "text", _mostrar);
        }
    });

    $("#result_view").on("click", function(){
        $("#ceditor").show();
        $("#cvisor").hide();

        $(".action_button").removeClass("selected");
        $("#result_view").addClass("selected");
    });

    $("#hybrid_view").on("click", function(){
      $("#ceditor").show();
      $("#cvisor").show();
      $(".action_button").removeClass("selected");
      $("#hybrid_view").addClass("selected");
    });

    $("#edit_view").on("click", function(){
      $("#cvisor").show();
      $("#ceditor").hide();
      $(".action_button").removeClass("selected");
      $("#edit_view").addClass("selected");
    });

    $("#cvisor").resizable({ handles: 'w' });
    $('#cvisor').resize(function(){
       $('#ceditor').width($("#parent").width()-$("#cvisor").width() - 40);
       console.log("PARENT: " + $("#parent").width());
       console.log("EDITOR: " + $('#ceditor').width());
       console.log("VISOR: " + $("#cvisor").width());
       console.log("SUMA: " + ($("#cvisor").width()+$('#ceditor').width()));
    });
  };

  var _loadFirstTab = function(){
    //load first tab
    var primera_tab = "00a_date.htm";
    var local = localStorage.getItem(primera_tab);
    if(local!=null){
      _mostrar(local);
    } else {
      $.get(primera_tab, "text", function(ejemplo){
        _mostrar(ejemplo);
      });
    }
    _poner_titulo(primera_tab);
  };

  var _poner_titulo = function (titulo){
     var titulo_final = titulo.substring(titulo.indexOf("_")+1,titulo.indexOf(".")).replace(/_/g, ' ');
     titulo_final = titulo_final[0].toUpperCase() + titulo_final.slice(1);

     $("#titulo_ejemplo").html(titulo_final);
  }

  var _mostrar = function (ejemplo){
   editor.val(ejemplo);
   _ejecutar(ejemplo);
  };


  var _ejecutar = function (ejemplo){
   var iframe = document.getElementById('iframe');

   if(iframe.contentDocument) doc = iframe.contentDocument;
   else if(iframe.contentWindow) doc = iframe.contentWindow.document;
   else doc = iframe.document;

   doc.open();
   doc.writeln(ejemplo);
   doc.close();
  }

  var _download_code = function (filename) {
   var dataToDownload = $("#editor").val();

   var blob = new Blob([dataToDownload], {type: "text/plain;charset=utf-8"});
   saveAs(blob, filename);
  }

  return {
  		init 					: init
  }
}) (HTMLPlayer,jQuery);
