
////////////////////////////////////////////////////////////////////////
//JQUERY extends begin
////////////////////////////////////////////////////////////////////////
$.fn.extend({

    serializeOBJ: function () { //serializes form elements to object

        var object = {};
        var jq = $(this);

        $(this).find("input, textarea, select").each(function (key, value) {

            var $el = $(this);


            if ($el.is('input[type="file"]')) { // type file clone
                object[$el.attr("name")] = $el.clone(true).removeAttr('id'); // remove id we can't have elements with the same id 
            }
            else {
                var val = $el.val().replace(/"/g, '&quot;'); //in case there are quotes inside a textarea or input

                if ($el.is(':checkbox')) {
                    object[$el.attr("name")] = $el.is(':checked');
                }
                else if ($el.is('select')) {
                    object[$el.attr("name")] = {
                        value: $el.find(":selected").val(),
                        text: $el.find(":selected").text().trim()
                    }
                }
                else {
                    object[$el.attr("name")] = val;
                }
            }


        });

        return object;
    },

    bindToObject: function (object) {

        for (var prop in object) {

            if (object.hasOwnProperty(prop)) {

                if (typeof object[prop] !== 'object') { // if not jquery object inside or file input
                   
                    var isBoolean = object[prop] instanceof String && ['true', 'false'].indexOf(object[prop].toLowerCase()) > -1;

                    if (isBoolean) {
                        $(this).find('input[name="' + prop + '"]').attr('checked', object[prop]);

                    } else {

                        $(this).find('[name="' + prop + '"]').val(object[prop])
                    }
                }
            }
        }
    }
});
////////////////////////////////////////////////////////////////////////
//JQUERY EXTENDS END
////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////
//TABITEM begin
////////////////////////////////////////////////////////////////////////
var TabItem = (function ($) {

    function to(url) {
        var $tab = $("#tab");

        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'html', // <-- to expect an html response,
            cache: true,
            success: function (tabData) {
                $tab.html(tabData);
            },
            error: function (error) {

                $("#tab").text(error.responseText);
            }
        });
    }

    function clickHandler(element) {
        $(element).click(function () {

            var menu = $(this).attr("data-menu");

            //switch (menu) {
            //    case "Contact": to("/Contact/" + editOrCreate()); return;
            //    case "Attachement": to("/Attachement/Create/" + route().id); return;
            //    default: return;
            //}

            if (menu === "Contact") to("/Contact/" + editOrCreate());
            else {
                to("/" + menu + "/Create/" + route().id);
            }

            window.location.hash = "#tab=" + menu;


        });
    }

    function editOrCreate() {
        var r = route();
        return r.edit ? "Edit/" + r.id : "Create";
    }

    /*   function loader() {
           $(document).ajaxStart(function () {
               $("#tab #loader").show();//show loader before tab appears
           });
       }
       */
    function route() {
        var p = window.location.pathname;
        var tab = window.location.hash;

        if (p.indexOf("Beneficiary/Detail") > -1) {
            var data = p.substring(1).split('/');

            if (data[2]) {
                return {
                    edit: true,
                    id: data[2],
                    tab: tab !== '' ? tab.split('=')[1] : undefined
                }
            }

            return { edit: false }
        }
    }

    return {

        init: function () {
            var r = route();

            if (r.edit && r.tab !== undefined) {
                to("/" + r.tab + "/Create/" + r.id + "#tab=" + r.tab);
                $('a[data-menu=Contact]').parent().removeClass('active');
                $("a[data-menu=" + r.tab + "]").parent().addClass('active');
            }
            else if (r.edit) {
                to("/Contact/Edit/" + r.id);
            } else {
                to("/Contact/Create");
            }



            clickHandler(".tabbable ul li a");
        },

        to: to
    }

})(jQuery);

////////////////////////////////////////////////////////////////////////
//TABITEM end
////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////
//Contact object begin
////////////////////////////////////////////////////////////////////////

var Common = {
    //function that recreates indexes of hidden inputs found in table rows such as Addresses[0].Property, ...
    recreateIndexes: function (target) {
        $(target).each(function (key, value) {

            var $el = $(this);

            $el.find('td input').each(function () {

                var $input = $(this);
                var attr = $input.attr('name').replace(/\[[0-9]{1,}\]/g, '[' + key + ']');
                $input.attr('name', attr);

            });

        });
    },

    inputDisabled: function (type, name, value) {
        return '<input type="' + type + '" name="' + name + '" value="' + value + '" class="textInput" disabled/>'
    },

    objectGetPropertiesOnly: function (object) {
        var obj = {};

        for (var prop in object) {
            if (object.hasOwnProperty(prop)) {
                var newProp = prop.substring(prop.indexOf('].') + 2);
                obj[newProp] = object[prop];
            }
        }
        return obj;
    },

    confirm: function (heading, body, cancelButtonTxt, okButtonTxt, callback) {

        var confirmModal = $('<div id="light">' +
                                 '<header id="heading">'
                                   + heading +
                                 '</header>' +
                                    '<hr />' +
                                 '<section id="body">'
                                    + body +
                                '</section>' +
                                    '<hr />' +
                                '<footer>' +
                                '   <button id = "okButton" class="btn btn-default">' + okButtonTxt + '</button>' +
                                '   <button id = "cancelButton" class="btn btn-default">' + cancelButtonTxt + '</button>' +
                                '</footer>' +
                            '</div>').appendTo($('html'));

        var fade = $('<div id="fade"></div>').click(function () {

            confirmModal.hide();
            $(this).hide();

        }).appendTo($('html'));

        function show() {
            fade.show();
            confirmModal.show();
        }

        function hide() {
            fade.hide();
            confirmModal.hide();
        }

        confirmModal.find('#okButton').click(function (event) {
            callback();
            hide();
        });

        confirmModal.find('#cancelButton').click(function (event) {
            hide();
        });

        show();
    }
}


var Contact = (function ($) {

    var $beneficiaryForm, $addressAddOrEditBtn = null;

    function addAddress() {

        $addressAddOrEditBtn.click(function () {

            var $addressForm = $("#address_form");
            var valid = $addressForm.valid();

            if (valid) {

                var adr = $addressForm.serializeOBJ();
                var $adrTable = $("#address_table");
                var index = $adrTable.find('tbody tr').length;

                $adrTable.append(
                        '<tr>' +
                            '<td>' + Common.inputDisabled('text', 'Addresses[' + index + '].Ligne1', adr.Ligne1) + '</td>' +
                            '<td>' + Common.inputDisabled('text', 'Addresses[' + index + '].Ligne2', adr.Ligne2) + '</td>' +
                            '<td>' + Common.inputDisabled('text', 'Localities[' + index + '].LocaliteNom', adr.LocaliteNom) + '</td>' +
                            '<td>' + Common.inputDisabled('text', 'Localities[' + index + '].CodePostal', adr.CodePostal) + '</td>' +
                            '<td>' + Common.inputDisabled('text', 'Addresses[' + index + '].Pays', adr.Pays) + '</td>' +
                            '<td>' + adr.IDTypeAdresse.text +
                                Common.inputDisabled('hidden', 'Addresses[' + index + '].IDTypeAdresse', adr.IDTypeAdresse.value)
                            + '</td>' +
                        '</tr>'
                    );

                if ($addressAddOrEditBtn.text() === 'Sauver') {
                    $adrTable.find('tbody tr.selectedRow').remove();
                    recreateIndexes('#address_table tbody tr');
                }

                $("#AddressModal").modal('hide');

            }
        });
    }

    function editAddress() {
        $('#benef_address_edit').click(function () {

            var object = $('#address_table tbody tr.selectedRow').serializeOBJ();
            if (object != null)
                $('#address_form').bindToObject(Common.objectGetPropertiesOnly(object));

        });
    }

    function addressFormModal() //reset form
    {

        $('#AddressModal').on('hide.bs.modal', function (e) {
            $('#address_form').trigger('reset');
        });

        $('#AddressModal').on('show.bs.modal', function (e) {

            var triggerTargetID = $(e.relatedTarget).attr('id');

            if (triggerTargetID === 'benef_address_edit') {
                $addressAddOrEditBtn.text("Sauver");
            }
            else {
                $addressAddOrEditBtn.text("Ajouter");
            }
        });

    }

    function addStay() {
        $('#benef_stay_add, div#edit_stay_btn_container button#update_stay').click(function () {

            var $stayForm = $('#stay_form');
            var valid = $stayForm.valid();

            if (valid) {
                var stay = $stayForm.serializeOBJ();
                var $tab = $("#stays_table tbody");
                var i = $tab.find('tr').length;

                $tab.append(
                        '<tr>' +
                            '<td>' + Common.inputDisabled('text', 'Stays[' + i + '].DateEntree', stay.DateEntree) + '</td>' +
                            '<td>' + Common.inputDisabled('text', 'Stays[' + i + '].DateSortie', stay.DateSortie) + '</td>' +
                            '<td>' + Common.inputDisabled('text', 'Stays[' + i + '].DateDebutConvention', stay.DateDebutConvention) + '</td>' +
                            '<td>' + Common.inputDisabled('text', 'Stays[' + i + '].DateDebutAccord', stay.DateDebutAccord) + '</td>' +
                            '<td>' + Common.inputDisabled('text', 'Stays[' + i + '].DateFinAccord', stay.DateFinAccord) + '</td>' +
                            '<td class="displayNone">' + Common.inputDisabled('hidden', 'Stays[' + i + '].HeureEntree', stay.DateEntree + ' ' + stay.HeureEntree) + '</td>' +
                            '<td class="displayNone">' + Common.inputDisabled('hidden', 'Stays[' + i + '].HeureSortie', stay.DateSortie + ' ' + stay.HeureSortie) + '</td>' +
                            '<td class="displayNone">' + Common.inputDisabled('hidden', 'Stays[' + i + '].DateFinConvention', stay.DateFinConvention) + '</td>' +
                            '<td class="displayNone">' + Common.inputDisabled('hidden', 'Stays[' + i + '].ReferenceConvention', stay.ReferenceConvention) + '</td>' +
                            '<td class="displayNone">' + Common.inputDisabled('hidden', 'Stays[' + i + '].Prolongation', stay.Prolongation) + '</td>' +
                            '<td class="displayNone">' + Common.inputDisabled('hidden', 'Stays[' + i + '].DateFinProlongation', stay.DateFinProlongation) + '</td>' +
                            '<td class="displayNone">' + Common.inputDisabled('hidden', 'Stays[' + i + '].EtatAccordMutualiste', stay.EtatAccordMutualiste) + '</td>' +
                            '<td class="displayNone">' + Common.inputDisabled('hidden', 'Stays[' + i + '].Commentaires', stay.Commentaires) + '</td>' +
                        '</tr>'

                )
                if ($(this).attr('id') === 'update_stay') {
                    $tab.find('tr.selectedRow').remove();
                    Common.recreateIndexes("#stays_table tbody tr");
                    $('div#edit_stay_btn_container').hide();
                    $stayForm.trigger('reset');
                }
            }

        });
    }

    function editStay() {
        $('body').on('click', 'table#stays_table tbody tr', function () {

            var $el = $(this);
            var object = $el.serializeOBJ();

            $("#stay_form").bindToObject(Common.objectGetPropertiesOnly(object));
        });

    }

    function setUpValidationForAddressForm() {

        $("#address_form").validate({
            rules: {
                Ligne1: { required: true },
                LocaliteNom: { required: true },
                CodePostal: {
                    required: true,
                    number: true
                },
                Pays: { required: true },
                IDTypeAdresse: { required: true }
            },
            messages: {
                Ligne1: { required: "L'adresse est obligatoire" },
                LocaliteNom: { required: "La localite est obligatoire" },
                CodePostal: {
                    required: "Le code postal est obligatoire",
                    number: "Le code postal doit être en chiffre"
                },
                Pays: { required: "Le pays est obligatoire" },
                IDTypeAdresse: { required: "Veuillez choisir un type d'adresse" }
            }
        });

    }

    function setUpValidationStayForm() {
        $('#stay_form').validate({
            rules: {
                DateEntree: { required: true },
                HeureEntree: { required: true },
                DateDebutConvention: { required: true },
                DateFinConvention: { required: true },
                ReferenceConvention: { required: true }
            },
            messages: {
                DateEntree: { required: "La date d'entrée est obligatoire" },
                HeureEntree: { required: "L'heure d'entrée est obligatoire" },
                DateDebutConvention: { required: "La date de début de convention est obligatoire" },
                DateFinConvention: { required: "La date de fin de convention  est obligatoire" },
                ReferenceConvention: { required: "La réference de convention est obligatoire" }
            }
        });
    }

    function setUpBeneficiaryValidationForm() {
        $beneficiaryForm.validate({

            rules: {
                'Beneficiary.Nom': { required: true, maxlength: 100 },
                'Beneficiary.Prenom': { required: true, maxlength: 100 },
                'Beneficiary.DateNaissance': { required: true },
                'Beneficiary.CarteIdentite': { required: true, number: true, maxlength: 100 }
            },

            messages: {
                'Beneficiary.Nom': { required: "Le nom est obligatoire", maxlength: "longueur maximum 100 caratères" },
                'Beneficiary.Prenom': { required: "Le prenom est obligatoire", maxlength: "longueur maximum 100 caratères" },
                'Beneficiary.DateNaissance': { required: "Le date de naissance est obligatoire" },
                'Beneficiary.CarteIdentite': { required: "Le numéro de carte d'identité est obligatoire", number: "composé uniquement des chiffres", maxlength: "longueur maximum 100 caratères" }
            }
        });
    }

    function selectRow() {
        $('body').on('click', 'table#address_table tbody tr, table#stays_table tbody tr', function () {

            var $el = $(this);
            $el.parent().find('tr, td input').removeClass('selectedRow');
            $el.addClass('selectedRow');

            if ($el.parent().parent().attr('id') === 'stays_table') {
                $('div#edit_stay_btn_container').show();
            }
        });
    }

    function deleteRow() {
        $("#benef_address_delete,#benef_stay_delete").click(function () {

            var id = $(this).attr('id');
            if (id === 'benef_address_delete') {
                $("table#address_table tbody tr.selectedRow").remove();
                Common.recreateIndexes("table#address_table tbody tr");
            }
            else if (id === 'benef_stay_delete') {
                $("table#stays_table tbody tr.selectedRow").remove();
                Common.recreateIndexes("table#stays_table tbody tr");
            }

        });
    }

    function submitForm() {
        $('#saveContact').click(function () {

            if ($beneficiaryForm.valid()) {
                $beneficiaryForm.find('input[disabled]').removeAttr('disabled');
                $beneficiaryForm.submit();
            }

        });
    }


    return {
        init: function () {
            $addressAddOrEditBtn = $("#addressAddOrEdit");
            $beneficiaryForm = $('#BeneficiaryContact');
            addAddress();
            editAddress();
            addressFormModal();
            setUpValidationForAddressForm();
            setUpBeneficiaryValidationForm();
            setUpValidationStayForm();
            selectRow();
            deleteRow();
            addStay();
            editStay();
            submitForm();

        }
    }

})(jQuery);

////////////////////////////////////////////////////////////////////////
//Contact object end
////////////////////////////////////////////////////////////////////////


var Attachement = (function ($) {

    function selectRow() {

        var clicks = 0;

        $('table#attach_table').on('click', 'tbody tr', function (e) {

            // clicks += 1;

            var $el = $(this);
            $form = $('#attach_form');

            if ($el.hasClass('selectedRow')) {

                $el.removeClass('selectedRow');
                $form = $('#attach_form').trigger('reset');
                $('#download').hide();
                $('#upload').show();

            } else {

                $el.parent().find('tr').removeClass('selectedRow');
                $el.addClass('selectedRow');

                var obj = Common.objectGetPropertiesOnly($el.serializeOBJ());
                $form.bindToObject(obj);
                changeDownloadUrl($('#IDBeneficiaire').val(), obj.IDPieceJointe);
                $('#download').show();
                $('#upload').hide();
            }

        });
    }

    function changeDownloadUrl(benefId, fileId) {
        var href = $('#download').attr('href');
        var newHref = href.substring(0, href.indexOf('?') + 1) + 'benefId=' + benefId + '&fileId=' + fileId;
        $('#download').attr('href', newHref);

    }

    function deleteRow() {

        $("#attach_delete").click(function () {

            var $selected = $("table#attach_table tbody tr.selectedRow");
            var $el = $selected.find('td.displayNone input[name$="IDPieceJointe"]');

            if ($el[0] !== undefined) {
                var $from = $("#attachements_form");
                var index = $from.find('input[name^="AttachementsToDelete"]').length;
                console.log(index);
                $from.append(Common.inputDisabled('hidden', 'AttachementsToDelete[' + index + ']', $el.val()));
            }

            $("table#attach_table tbody tr.selectedRow").remove();
            Common.recreateIndexes("table#attach_table tbody tr");
            $form = $('#attach_form').trigger('reset');
            $('#download').hide();
            $('#upload').show();
        });

    }

    function setUpValidationForm() {
        $('#attach_form').validate({

            rules: {
                LibellePiece: { required: true },
                DatePiece: { required: true },
                Piece: { required: true }
            },

            messages: {
                LibellePiece: { required: "Le Libelle est obligatoire" },
                DatePiece: { required: "La date est obigatoire" },
                Piece: { required: "Le fichier est obligatoire" }
            }

        }).settings.ignore = []; // don't ignore hidden elements
    }

    function addAttachement() {
        $("#attach_add, #edit").click(function () {

            var $form = $('#attach_form');
            var edit = $(this).attr('id') === 'edit';

            if ($form.valid()) {

                var obj = $form.serializeOBJ();
                var index = $('#attach_table tbody tr').length;
                var $tab = $('#attach_table tbody');

                $('#attach_table tbody').append(
                        '<tr>' +
                               '<td>' + Common.inputDisabled('text', 'Attachements[' + index + '].LibellePiece', obj.LibellePiece) + '</td>' +
                               '<td>' + Common.inputDisabled('text', 'Attachements[' + index + '].DatePiece', obj.DatePiece) + '</td>' +
                               '<td>' + obj.IDTypeAction.text +
                                    Common.inputDisabled('hidden', 'Attachements[' + index + '].IDTypeAction', obj.IDTypeAction.value) + '</td>' +
                                '<td><span class="glyphicon glyphicon-file"></span><div class="displayNone"></di></td>' +
                        '</tr>'
                    );

                obj.Piece.attr('name', 'Attachements[' + index + '].Piece');
                $('#attach_table tbody tr:last td:last div').html(obj.Piece);
            }
        });
    }

    function upload() {
        $("#upload").click(function () {
            $('#Piece').trigger('click');
        });

        $("#Piece").change(function () {
            $("#fileName").text($('#Piece')[0].files[0].name);
        });
    }

    function search() {
        $("#search_btn").click(function () {

            TabItem.to("/Attachement/Create?" + $('#search_form').serialize());

        });
    }

    function submitAttachements() {
        $('#saveAttachement').click(function () {

            var $from = $('#attachements_form');

            $from.find('input[disabled]').removeAttr('disabled');
            $from.submit();
        });
    }

    return {
        init: function () {
            selectRow();
            deleteRow();
            addAttachement();
            upload();
            search();
            setUpValidationForm();
            submitAttachements();
        }
    }

})(jQuery);

var SearchBeneficiaryDataTables = (function ($) {

    var rowSelected = false;

    function selectRow() {

        $('#BeneficiaryTable tbody').on('click', 'tr', function () {
            var $el = $(this);
            if ($el.hasClass('selectedRow')) {
                $el.removeClass('selectedRow');
                rowSelected = false;
            }
            else {
                $('#BeneficiaryTable tbody tr.selectedRow').removeClass('selectedRow');
                $el.addClass('selectedRow');
                rowSelected = true;
                constructUrl();
            }
        });
    }

    function constructUrl() {
        var links = ["Detail", "Delete"];
        var id = $('#BeneficiaryTable tbody tr.selectedRow').attr('data-id');

        links.forEach(function (link) {
            var el = $('a#' + link);
            var href = el.attr('href');
            el.attr('href', href.substring(0, href.indexOf(link) + link.length) + '/' + id);
        });

    }

    function deleteOrDetails() {
        $("#Detail,#Delete").click(function (e) {

            if (!rowSelected) {
                e.preventDefault();
                alert("Aucune ligne n'a été sélectionnée");

            } else {

                if ($(this).attr('id') === "Detail") {
                    return;

                } else {
                    e.preventDefault();
                    var scope = this;
                    Common.confirm("Confirmer", "Etes-vous sure de supprimer?", "annuler", "confimer", function () {

                        $.ajax({
                            method: "POST",
                            url: $(scope).attr('href'),
                            success: function (data) {
                                if (data === "OK") {
                                    $('#BeneficiaryTable tbody tr.selectedRow').remove();
                                } else {
                                    console.log(data);
                                }
                            }
                        });
                    });
                }
            }

        });
    }

    return {
        init: function () {
            //   $('#BeneficiaryTable').dataTable();
            selectRow();
            deleteOrDetails();
        }
    }

})(jQuery);

var Earning = (function ($) {

    function setupValidation() {
        $("#earnings_form").validate({
            rules: {
                RevenusCPAS: { number: true },
                RevenusIITMutuelle: { number: true },
                RevenusAllocHandic: { number: true },
                MontantPensionAlim: { number: true },
                AutresRevenus: { number: true },
            },
            messages: {
                RevenusCPAS: { number: "ce champ doîte être un nombre" },
                RevenusIITMutuelle: { number: "ce champ doîte être un nombre" },
                RevenusAllocHandic: { number: "ce champ doîte être un nombre" },
                MontantPensionAlim: { number: "ce champ doîte être un nombre" },
                AutresRevenus: { number: "ce champ doîte être u nombre" },
            }
        });

        $("#earnings_form").submit(function (e) {

            if (!$(this).valid) {
                e.preventDefault();
            }

        });
    }

    function total() {
        $("#earnings_form input[data-total]").focusout(function () {
            var total = 0;
            $("#earnings_form input[data-total]").each(function (key, value) {
                // console.log($(this).val());
                var val = $(this).val();
                if (val !== '')
                    total += parseFloat($(this).val());
            });

            $('#TotalRevenus[name="TotalRevenus"]').val(total);
        });
    }
    return {
        init: function () {
            setupValidation();
            total();
        }
    }

})(jQuery);

////////////////////////////////////////////////////////////////////////
//Atelier object begin
////////////////////////////////////////////////////////////////////////

var Atelier = (function ($) {

    var $AtelierForm, $atelierAddOrEditBtn = null;

    function selectRowAndEdit() {
        $('body').on('click', 'table#atelier_table tbody tr', function () {

            var $el = $(this);
            $el.parent().find('tr, td input').removeClass('selectedRow');
            $el.addClass('selectedRow');

            var object = $('#atelier_table tbody tr.selectedRow').serializeOBJ();
            $('#atelier_form').bindToObject(Common.objectGetPropertiesOnly(object));

            $('div#edit_atelier_btn_container').show();



        });
    }

    function addAtelier() {
        $('#atelier_add, div#edit_atelier_btn_container button#update_atelier').click(function () {

            var $atelierForm = $('#atelier_form');
            var valid = $atelierForm.valid();

            if (valid) {
                var atelier = $atelierForm.serializeOBJ();
                var $tab = $("#atelier_table tbody");
                var i = $tab.find('tr').length;
                $tab.append(
                        '<tr>' +
                            '<td>' + Common.inputDisabled('text', 'atelierAffichage[' + i + '].NomAtelier', atelier.IDAtelier.text) + '</td>' +
                            '<td class="displayNone">' + Common.inputDisabled('hidden', 'atelierAffichage[' + i + '].IDAtelier', atelier.IDAtelier.value) + '</td>' +
                            '<td>' + Common.inputDisabled('text', 'atelierAffichage[' + i + '].Date', atelier.Date) + '</td>' +
                            '<td>' + Common.inputDisabled('text', 'atelierAffichage[' + i + '].NbreHeures', atelier.NbreHeures.value) + '</td>' +
                        '</tr>'

                )
                if ($(this).attr('id') === 'update_atelier') {
                    $tab.find('tr.selectedRow').remove();
                    Common.recreateIndexes("#atelier_table tbody tr");
                    $('div#edit_atelier_btn_container').hide();
                    $atelierForm.trigger('reset');

                    
                }
            }

        });
    }

    function deleteRow() {
        $("#atelier_delete").click(function () {

            var id = $(this).attr('id');
            if (id === 'atelier_delete') {
                Common.confirm("Confirmer", "Etes-vous sure de supprimer?", "annuler", "confimer", function () {

                    $("table#atelier_table tbody tr.selectedRow").remove();
                    Common.recreateIndexes("table#atelier_table tbody tr");

                    
                    $('div#edit_atelier_btn_container').hide();
                });

            }
        });
    }

    function submitForm() {
        $('#saveAtelier').click(function () {
            var $atelierForm = $('#ateliers_form');
            $atelierForm.find('input[disabled]').removeAttr('disabled');
            $atelierForm.submit();
            

        });
    }
    function setUpValidationForm() {
        $('#atelier_form').validate({

            rules: {
                IDAtelier: { required: true },
                Date: { required: true },
                NbreHeures: { required: true }
            },

            messages: {
                IDAtelier: { required: "Le nom de l'atelier est obligatoire" },
                Date: { required: "La date est obigatoire" },
                NbreHeures: { required: "Le nombre d'heures est obligatoire" }
            }

        }).settings.ignore = []; // don't ignore hidden elements
    }
    return {
        init: function () {
            selectRowAndEdit();
            addAtelier();
            deleteRow();
            submitForm();
            setUpValidationForm();
        }
    }
})(jQuery);

//console.log(Atelier);

////////////////////////////////////////////////////////////////////////
//Atelier object end
////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////
//CPAS object begin
////////////////////////////////////////////////////////////////////////
var CPAS = (function ($) {

    var $AtelierForm = null;


    function submitForm() {
        $('#saveCPAS').click(function () {
            var $atelierForm = $('#CPAS_form');
            //$atelierForm.find('input[disabled]').removeAttr('disabled');
            $atelierForm.submit();


        });
    }
    function setUpValidationForm() {
        $('#CPAS_form').validate({

            rules: {
                'Beneficiary.PersonneContactCPAS': { required: true },
                'Beneficiary.TelephoneContactCPAS': { required: true },
                'Beneficiary.CommentairesCPAS' :{ required: true}
            },

            messages: {
                'Beneficiary.PersonneContactCPAS': { required: "Le nom du contact est obligatoire" },
                'Beneficiary.TelephoneContactCPAS': { required: "Le téléphone du contact est obligatoire" },
                'Beneficiary.CommentairesCPAS' : { required: "Le commentaire est obligatoire"}
            }

        }).settings.ignore = []; // don't ignore hidden elements
    }
    function editCPAS() {
        $('#Beneficiary_IDCPAS').change(function () {
            var idCPAS = $('#Beneficiary_IDCPAS option:selected').val();

            $.ajax({
                method: "GET",
                url: "/Cpas/edit",
                data: { id: idCPAS },
                success: function (data) {
                    var obj = {};

                    for (var i in data) {

                        if(data.hasOwnProperty(i))
                        {
                            obj["Cpas." + i] = data[i];
                        }
                    }
                   $("#CPAS_form").bindToObject(obj);
                }
            });

        });
    }

    return {
        init: function () {
            submitForm();
            setUpValidationForm();
            editCPAS();
        }
    }
})(jQuery);
////////////////////////////////////////////////////////////////////////
//CPAS object end
////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////
//Mutuelle object begin
////////////////////////////////////////////////////////////////////////
var Mutuelle = (function ($) {

    var $Mutuelle_Form = null;


    function submitForm() {
        $('#saveMutuelle').click(function () {
            var $mutuelleForm = $('#Mutuelle_form');
            //$atelierForm.find('input[disabled]').removeAttr('disabled');
            $mutuelleForm.submit();


        });
    }
    function setUpValidationForm() {
        $('#Mutuelle_form').validate({

            rules: {
                'Beneficiary.NumeroInscriptionMutuelle': { required: true },
                'Beneficiary.MedecinConseil': { required: true },
                'Beneficiary.CommentairesMutuelle': { required: true }
            },

            messages: {
                'Beneficiary.NumeroInscriptionMutuelle': { required: "Le numéro d'incription mutuelle est obligatoire" },
                'Beneficiary.MedecinConseil': { required: "Le nom du medecin conseil est obligatoire" },
                'Beneficiary.CommentairesMutuelle': { required: "Le commentaire est obligatoire" }
            }

        }).settings.ignore = []; // don't ignore hidden elements
    }
    function editMutuelle() {
        $('#Beneficiary_IDMutuelle').change(function () {
            var IDMutuelle = $('#Beneficiary_IDMutuelle option:selected').val();
            $.ajax({
                method: "GET",
                url: "/Mutuelle/Edit",
                data: { id: IDMutuelle },
                success: function (data) {
                    var obj = {};

                    for (var i in data) {

                        if (data.hasOwnProperty(i)) {
                            obj["Mutuelle." + i] = data[i];
                        }
                    }
                    $("#Mutuelle_form").bindToObject(obj);
                }
            });

        });
    }

    return {
        init: function () {
            submitForm();
            setUpValidationForm();
            editMutuelle();
        }
    }
})(jQuery);
////////////////////////////////////////////////////////////////////////
//Mutuelle object end
////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////
//Medical object begin
////////////////////////////////////////////////////////////////////////
var Medical = (function ($) {

    function selectRowAndEdit() {
        $('body').on('click', 'table#medecin_table tbody tr', function () {

            var $el = $(this);
            $el.parent().find('tr, td input').removeClass('selectedRow');
            $el.addClass('selectedRow');

            var object = $('#medecin_table tbody tr.selectedRow').serializeOBJ();
            var med = Common.objectGetPropertiesOnly(object);

            var obj = {};
            for (var i in med) {
            if (med.hasOwnProperty(i)) {
                obj["medic." + i] = med[i];
               }
           }
            $("#Medical_form").bindToObject(obj);

            $('div#edit_medecin_btn_container').show();

        });
    }
    function submitForm() {
        $('#saveMedical').click(function () {
            var $medicalForm = $('#Medical_form');
            $medicalForm.find('input[disabled]').removeAttr('disabled');
            $medicalForm.submit();


        });
    }

    function addMedecin() {
        $('#medecin_add, div#edit_medecin_btn_container button#update_medecin').click(function () {

            var $medicalForm = $('#Medical_form');
            var valid = $medicalForm.valid();

            if (valid) {
                var medecin = $medicalForm.serializeOBJ();
                var $tab = $("#medecin_table tbody");
                var i = $tab.find('tr').length;
                $tab.append(
                        '<tr>' +
                            '<td>' + Common.inputDisabled('text', 'Medecin[' + i + '].Nom', medecin["medic.MedecinNom"] + " " + medecin["medic.MedecinPrenom"]) + '</td>' +
                            '<td class="displayNone">' + Common.inputDisabled('hidden', 'Medecin[' + i + '].IDMedecin', medecin["medic.IDMedecin"]) + '</td>' +
                            '<td class="displayNone">' + Common.inputDisabled('text', 'Medecin[' + i + '].MedecinNom', medecin["medic.MedecinNom"]) + '</td>' +
                            '<td class="displayNone">' + Common.inputDisabled('text', 'Medecin[' + i + '].MedecinPrenom', medecin["medic.MedecinPrenom"]) + '</td>' +
                            '<td class="displayNone">' + Common.inputDisabled('text', 'Medecin[' + i + '].MedecinAdresse1', medecin["medic.MedecinAdresse1"]) + '</td>' +
                            '<td class="displayNone">' + Common.inputDisabled('text', 'Medecin[' + i + '].MedecinAdresse2', medecin["medic.MedecinAdresse2"]) + '</td>' +
                            '<td class="displayNone">' + Common.inputDisabled('text', 'Medecin[' + i + '].MedecinCP', medecin["medic.MedecinCP"]) + '</td>' +
                            '<td class="displayNone">' + Common.inputDisabled('text', 'Medecin[' + i + '].MedecinLocalite', medecin["medic.MedecinLocalite"]) + '</td>' +
                            '<td class="displayNone">' + Common.inputDisabled('text', 'Medecin[' + i + '].MedecinTelephone', medecin["medic.MedecinTelephone"]) + '</td>' +
                            '<td class="displayNone">' + Common.inputDisabled('text', 'Medecin[' + i + '].MedecinFax', medecin["medic.MedecinFax"]) + '</td>' +
                            '<td class="displayNone">' + Common.inputDisabled('text', 'Medecin[' + i + '].MedecinEmail', medecin["medic.MedecinEmail"]) + '</td>' +
                            '<td class="displayNone">' + Common.inputDisabled('text', 'Medecin[' + i + '].Specialite', medecin["medic.Specialite"]) + '</td>' +
                            '<td class="displayNone">' + Common.inputDisabled('text', 'Medecin[' + i + '].CommentairesMedecin', medecin["medic.CommentairesMedecin"]) + '</td>' +
                        '</tr>'

                )
                if ($(this).attr('id') === 'update_medecin') {
                    $tab.find('tr.selectedRow').remove();
                    Common.recreateIndexes("#medecin_table tbody tr");
                    $('div#edit_medecin_btn_container').hide();
                    $medicalForm.trigger('reset');

                }
            }
            
        });
    }


    function deleteRow() {
        $("#medecin_delete").click(function () {

            var id = $(this).attr('id');
            if (id === 'medecin_delete') {
                Common.confirm("Confirmer", "Etes-vous sure de supprimer?", "annuler", "confimer", function () {

                    $("table#medecin_table tbody tr.selectedRow").remove();
                    Common.recreateIndexes("table#medecin_table tbody tr");

                    $('div#edit_medecin_btn_container').hide();
                });
            }
        });
    }
    function setUpValidationFormMedic() {
        $('#Medical_form').validate({
            onsubmit: false,
            rules: {
                'medic.MedecinNom': { required: true },
                'medic.MedecinPrenom': { required: true },
                'medic.Specialite': { required: true },
                'medic.MedecinAdresse1': { required: true },
                'medic.MedecinAdresse2': { required: true },
                'medic.MedecinLocalite': { required: true },
                'medic.MedecinCP': { required: true },
                'medic.MedecinEmail': { required: true },
                'medic.MedecinTelephone': { required: true },
                'medic.MedecinFax': { required: true },
                'medic.CommentairesMedecin': { required: true }

            },

            messages: {
                'medic.MedecinNom': { required: "Le nom du médecin est obligatoire" },
                'medic.MedecinPrenom': { required: "Le prénom du médecin est obligatoire" },
                'medic.Specialite': { required: "La spécialité est obligatoire" },
                'medic.MedecinAdresse1': { required: "L'adresse est obligatoire" },
                'medic.MedecinAdresse2': { required: "L'adresse est obligatoire" },
                'medic.MedecinLocalite': { required: "La localité est obligatoire" },
                'medic.MedecinCP': { required: "Le code postal est obligatoire" },
                'medic.MedecinEmail': { required: "L'email est obligatoire" },
                'medic.MedecinTelephone': { required: "Le téléphone est obligatoire" },
                'medic.MedecinFax': { required: "Le fax est obligatoire" },
                'medic.CommentairesMedecin': { required: "Le commentaire est obligatoire" }
            }

        }).settings.ignore = []; // don't ignore hidden elements
    }
    return {
        init: function () {
            selectRowAndEdit();
            submitForm();
            addMedecin();
            deleteRow();
            setUpValidationFormMedic();
            
        }
    }
})(jQuery);
////////////////////////////////////////////////////////////////////////
//Medical object end
////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////
//Europasi object begin
////////////////////////////////////////////////////////////////////////
var Europasi = (function ($) {

    function selectRowAndEdit() {
        $('body').on('click', 'table#europasi_table tbody tr', function () {

            var $el = $(this);
            $el.parent().find('tr, td input').removeClass('selectedRow');
            $el.addClass('selectedRow');

            var object = $('#europasi_table tbody tr.selectedRow').serializeOBJ();
            var med = Common.objectGetPropertiesOnly(object);

            var obj = {};
            for (var i in med) {
                if (med.hasOwnProperty(i)) {
                    obj["Europasi." + i] = med[i];
                }
            }
            $("#enquete_form").bindToObject(obj);

            $('div#edit_europasi_btn_container').show();

        });
    }

    function deleteRow() {
        $("#europasi_delete").click(function () {

            var id = $(this).attr('id');
            if (id === 'europasi_delete') {
                
                Common.confirm("Confirmer", "Etes-vous sure de supprimer?", "annuler", "confimer", function () {

                    $("table#europasi_table tbody tr.selectedRow").remove();
                    Common.recreateIndexes("table#europasi_table tbody tr");

                    $('div#edit_europasi_btn_container').hide();

                });

            }
        });
    }

    function addEuropasi() {
        $('#europasi_add, div#edit_europasi_btn_container button#update_europasi').click(function () {

            var $enqueteForm = $('#enquete_form');
            var valid = $enqueteForm.valid();

            if (valid) {
                var europasi = $enqueteForm.serializeOBJ();
                var $tab = $("#europasi_table tbody");
                var i = $tab.find('tr').length;
                $tab.append(
                        '<tr>' +
                            '<td>' + Common.inputDisabled('text', 'ListeEuropasi[' + i + '].DatePassage', europasi["Europasi.DatePassage"]) + '</td>' +
                            '<td>' + Common.inputDisabled('text', 'ListeEuropasi[' + i + '].Nom', europasi["Europasi.TypeQuestionnaire"].text) + '</td>' +
                            '<td class="displayNone">' + Common.inputDisabled('text', 'ListeEuropasi[' + i + '].IDBeneficiare', europasi["Europasi.IDBeneficiare"]) + '</td>' +
                            '<td class="displayNone">' + Common.inputDisabled('text', 'ListeEuropasi[' + i + '].SanteMentalePhysique', europasi["Europasi.SanteMentalePhysique"].value) + '</td>' +
                            '<td class="displayNone">' + Common.inputDisabled('text', 'ListeEuropasi[' + i + '].EtatPsychologique', europasi["Europasi.EtatPsychologique"].value) + '</td>' +
                            '<td class="displayNone">' + Common.inputDisabled('text', 'ListeEuropasi[' + i + '].DomaineFamilial', europasi["Europasi.DomaineFamilial"].value) + '</td>' +
                            '<td class="displayNone">' + Common.inputDisabled('text', 'ListeEuropasi[' + i + '].SituationJudiciaire', europasi["Europasi.SituationJudiciaire"].value) + '</td>' +
                            '<td class="displayNone">' + Common.inputDisabled('text', 'ListeEuropasi[' + i + '].Drogues', europasi["Europasi.Drogues"].value) + '</td>' +
                            '<td class="displayNone">' + Common.inputDisabled('text', 'ListeEuropasi[' + i + '].Alcool', europasi["Europasi.Alcool"].value) + '</td>' +
                            '<td class="displayNone">' + Common.inputDisabled('text', 'ListeEuropasi[' + i + '].SituationEmploi', europasi["Europasi.SituationEmploi"].value) + '</td>' +
                            '<td class="displayNone">' + Common.inputDisabled('text', 'ListeEuropasi[' + i + '].TypeQuestionnaire', europasi["Europasi.TypeQuestionnaire"].value) + '</td>' +
                        '</tr>'

                )
                if ($(this).attr('id') === 'update_europasi') {
                    $tab.find('tr.selectedRow').remove();
                    Common.recreateIndexes("#europasi_table tbody tr");
                    $('div#edit_europasi_btn_container').hide();
                    $enqueteForm.trigger('reset');

                }
            }

        });
    }

    function submitForm() {
        $('#saveEuropasi').click(function () {
            var $europasiForm = $('#europasi_form');
            $europasiForm.find('input[disabled]').removeAttr('disabled');
            $europasiForm.submit();


        });
    }

    function setUpValidationFormEuropasi() {
        $('#enquete_form').validate({
            rules: {
                'Europasi.TypeQuestionnaire': { required: true },
                'Europasi.DatePassage': { required: true },
                'Europasi.SanteMentalePhysique': { required: true },
                'Europasi.SituationEmploi': { required: true },
                'Europasi.Alcool': { required: true },
                'Europasi.Drogues': { required: true },
                'Europasi.SituationJudiciaire': { required: true },
                'Europasi.DomaineFamilial': { required: true },
                'Europasi.EtatPsychologique': { required: true }

            },

            messages: {
                'Europasi.TypeQuestionnaire': { required: "Le champ type de questionnaire est obligatoire" },
                'Europasi.DatePassage': { required: "Le champ date de passage est obligatoire" },
                'Europasi.SanteMentalePhysique': { required: "Le champ santé mentale physique est obligatoire" },
                'Europasi.SituationEmploi': { required: "Le champ situation d'emploi est obligatoire" },
                'Europasi.Alcool': { required: "Le champ alcool est obligatoire" },
                'Europasi.Drogues': { required: "Le champ drogues est obligatoire" },
                'Europasi.SituationJudiciaire': { required: "Le champ situation judiciaire est obligatoire" },
                'Europasi.DomaineFamilial': { required: "Le champ domaine familial est obligatoire" },
                'Europasi.EtatPsychologique': { required: "Le champ état psychologique est obligatoire" }
            }

        });
    }

    return {
        init: function () {
            selectRowAndEdit();
            deleteRow();
            addEuropasi();
            submitForm();
            setUpValidationFormEuropasi();
        }
    }
})(jQuery);
////////////////////////////////////////////////////////////////////////
//Europasi object end
////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////
//Test modal begin
////////////////////////////////////////////////////////////////////////



////////////////////////////////////////////////////////////////////////
//Test modal end
////////////////////////////////////////////////////////////////////////