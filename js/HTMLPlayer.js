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
  var structure;
  var modulocargado;
  var aceditor;
  var path_relativo = '';
  var indicemodulo;
  var indicefolder;
  var indicetab;

  var init = function(options){
    editor = $("#editor");
    w = window.innerWidth;

    $.getJSON("ejemplos.json", function(json){
        structure = json;
        var options = '';
        if(window.localStorage){
          indicemodulo = localStorage.getItem("indicemodulo") ? localStorage.getItem("indicemodulo") : 0;
          indicefolder = localStorage.getItem("indicefolder") ? localStorage.getItem("indicefolder") : 0;
          indicetab = localStorage.getItem("indicetab") ? localStorage.getItem("indicetab") : 0;
        } else {
          indicemodulo = 0;
          indicefolder = 0;
          indicetab = 0;
        }
        var isselected = '';
        for (var i=0;i<structure.length;i++){
           isselected = i==indicemodulo ? 'selected':'';
           options += '<option value="'+ i + '" '+isselected+'>' + structure[i].name + '</option>';
        }
        $('#modulos').append(options);
        _inicializaEnventos();
        _initACEEditor();
        _loadModule(indicemodulo, indicefolder, indicetab);
    });
  };

  //METODOS PRIVADOS

  //Detectamos las features del browser a ver si habilitamos más opciones
  var _detectaFeaturesInicializaEventos = function(){
    //primero Subir fichero, para ello usaremos FileReader
    if(window.FileReader) {
      var fileInput = document.getElementById('fileInput');
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
        var tab = $(".tab.active").attr("path");
        localStorage.setItem(tab, aceditor.getValue());
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
        aceditor.setValue(reader.result,1);
        fileInput.removeEventListener('change', _handle_file_input);
        $(fileInput).val("");
        fileInput.addEventListener('change', _handle_file_input);
      }
      reader.readAsText(file);
    } else {
      aceditor.setValue("File not supported!",1);
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

    //cuando cambia el selector de modulos
    $("#modulos").change(function () {
      indicemodulo = $("#modulos option:selected").val();
      _loadModule(indicemodulo,0,0);
    });

    $(document).on("click", "nav a.moduletab", function(){
        indicefolder = $(this).attr("pos");
        var foldercontent = modulocargado.children[indicefolder];
        _loadSubTabs(foldercontent,0);
        $("nav a.moduletab").removeClass("moduleactive");
        $(this).addClass("moduleactive");
    });

    $(document).on("click", "nav a.tab", function(){
        indicetab = $(this).attr("pos");
        if(window.localStorage && localStorage.getItem($(this).attr("path"))!=null){
          _mostrar(localStorage.getItem($(this).attr("path")));
        } else {
          $.get($(this).attr("path"), "text", _mostrar);
        }
        if(window.localStorage){
          //al cambiar de tab guardamos en localstorage qué esta guardado, para volver
          localStorage.setItem("indicemodulo",indicemodulo);
          localStorage.setItem("indicefolder",indicefolder);
          localStorage.setItem("indicetab",indicetab);
        }
        _poner_titulo($(this).attr("title"));
        $("nav a.tab").removeClass("active");
        $(this).addClass("active");
    });

    $("#actualizar").on("click", function(){
      _ejecutar();
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
            $.get(path_relativo + "/" + tab, "text", _mostrar);
        }
    });

    $("#edit_view").on("click", function(){
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

    $("#result_view").on("click", function(){
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

  //funcion que carga la interfaz para el módulo de posición "indicemodulo" en el array "structure"
  //se encarga de mirar si tiene carpetas y si las tiene crea una primera fila de tabs
  //y carga las primeras subtabs
  //si no son carpetas, esta primera fila no se muestra y directamente llama a las subtabs
  //en las dos filas de tabs marca por defecto "indicefolder" e "indicetab"
  var _loadModule = function(indicemodulo, indicefolder, indicetab){
    modulocargado = structure[indicemodulo];
    var hijos = modulocargado.children;
    if(hijos[0] && hijos[0].type==="folder"){
      var lis = '';
      var extraclass;
      for (var i=0;i < hijos.length;i++){
         extraclass = indicefolder==i ? "activetab":"";
         lis += '<li><a href="javascript:void(0);" title="'+hijos[i].name+'" pos="'+i+'" class="moduletab '+extraclass+'">'+hijos[i].name+'</a></li>';
      }
      $("#menutop").show();
      $("#menutop").html(lis);
      //cargamos las subtabs de la primera carpeta que será la seleccionada por defecto
      _loadSubTabs(hijos[indicefolder], indicetab);
    } else {
      //no hay carpetas, así que cargamos las subtabs de children que son archivos
      $("#menutop").hide();
      indicefolder = -1; //asi es como marcamos que no hay nivel de tabs superior, para guardarlo en localstorage
      _loadSubTabs(modulocargado, indicetab);
    }
  };

  var _loadSubTabs = function(subtabs, indicetab){
    path_relativo = subtabs.path;
    var lis = '';
    var children = subtabs.children;
    for (var i=0;i < children.length;i++){
       lis += '<li><a href="javascript:void(0);" title="'+children[i].name+'" pos="'+i+'" path="'+children[i].path+'" class="tab">'+children[i].title+'</a></li>';
    }
    $("#menu").html(lis);
    //lanzamos un click en la tab de orden "indicetab"
    $($("#menu li a")[indicetab]).click();
  };

  var _poner_titulo = function (titulo){
     var titulo_final = titulo.substring(3,titulo.indexOf(".")).replace(/_/g, ' ');
     titulo_final = titulo_final[0].toUpperCase() + titulo_final.slice(1);

     $("#titulo_ejemplo").html(titulo_final);
  }

  var _mostrar = function(ejemplo){
   aceditor.setValue(ejemplo, 1);
   _ejecutar();
  };

  //ejecuta siempre lo que hay en el editor, no se lo paso como parámetro
  //porque hay que añadirle una tab <base> para los paths relativos
  //y eso es mejor hacerlo con el aceditor
  var _ejecutar = function (){
    var content = aceditor.getValue();

    var parser = new DOMParser();
    var my = parser.parseFromString(content, "text/html");
    //añadimos etiqueta <base> para los paths relativos
    var base = document.createElement('base');
    base.setAttribute("href", "/" + path_relativo + "/");
    //doc.head.appendChild(base);
    my.head.insertBefore(base, my.head.firstChild);

    //lo escribimos en el iframe
    var iframe = document.getElementById('iframe');
    if(iframe.contentDocument) doc = iframe.contentDocument;
    else if(iframe.contentWindow) doc = iframe.contentWindow.document;
    else doc = iframe.document;
    doc.open();
    doc.writeln("<!DOCTYPE html>" + my.documentElement.outerHTML);
    doc.close();
  }

  var _download_code = function (filename) {
   var dataToDownload = aceditor.getValue();

   var blob = new Blob([dataToDownload], {type: "text/plain;charset=utf-8"});
   saveAs(blob, filename);
  }

  var _initACEEditor = function(){
		aceditor = ace.edit("editor");
    aceditor.getSession().setMode("ace/mode/html");
    aceditor.setTheme("ace/theme/chrome");
		aceditor.$blockScrolling = Infinity;

		document.getElementById('editor').style.fontSize='14px';
		aceditor.setShowPrintMargin(false);

		aceditor.getSession().setTabSize(2);
	};

  return {
  		init 					: init
  }
}) (HTMLPlayer,jQuery);
