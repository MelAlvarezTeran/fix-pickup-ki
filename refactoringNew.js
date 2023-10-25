$(document).ready(function () {
  let listenerCreated = false;
  let listenerPups = false;
  let isGettingPoints = false;
  let blockedBtn = false

  // Observer que evalúa si existe en el DOM el input de Postal Code y si está visible
  const observerShipping = new MutationObserver((mutations, obsP) => {
    const zipcode = document.querySelector("#ship-postalCode");
    if (document.contains(zipcode)) {
      if ($("#ship-postalCode").is(":visible")) {
        if (!listenerCreated) {
          listenerCreated = true;
        } else {
          createListenerShipping(listenerCreated);
        }
      } else {
        listenerCreated = false;
      }
    }
  });

  observerShipping.observe(document, {
    childList: true,
    subtree: true
  });

  // Observer que evalúa si existe en el DOM el modal de PUPs y si está visible
  const observerPUPs = new MutationObserver((mutations, obsP) => {
    const modalPUPs = document.querySelector('.pac-target-input')

    if (document.contains(modalPUPs)) {
      if ($(".pac-target-input").is(":visible")) {
        if (!listenerPups) {
          listenerPups = true;
        } else {
          createListenerModal(listenerPups);
        }
      } else {
        listenerPups = false;
      }
    }
  });
  
  observerPUPs.observe(document, {
    childList: true,
    subtree: true
  });

  //Función que bloquea el click del botón de "Puntos de Retiro"
  function blockPickupClick (event) {
    console.log('Boton de PUP bloqueado')
    event.stopPropagation();
    event.preventDefault();
  }

  //Función que valida si el CP ingresado devuelve PUPs o no y muestra un mensaje de error en pantalla en caso de que no
  function validatePoints (pickPoints) {
    const errorMessage = 'No hay puntos de retiro cercanos a este código postal.';
    const parentElement = document.querySelector('.ship-postalCode.required.text');
    let errorElement = parentElement.querySelector('.help.error');
    const pickupButton = document.getElementById("shipping-option-pickup-in-point");

    if (pickPoints.length){
      if (errorElement) {
        errorElement.remove();
        pickupButton.removeEventListener("click", blockPickupClick);
        blockedBtn = false
      }
      pickupButton.removeEventListener("click", blockPickupClick);
      blockedBtn = false
    } else {
      blockedBtn = true
      pickupButton.addEventListener("click", blockPickupClick);
      if (!errorElement) {
        errorElement = document.createElement('span');
        errorElement.className = 'help error';
        errorElement.textContent = errorMessage;
        parentElement.appendChild(errorElement);
      } else {
        errorElement.textContent = errorMessage;
      }
    }
  }
  
  // Función que busca los PUPs para enviarlos a la función de validación
  function getPickup () {
    if (isGettingPoints) {
      return; // Return if it's already getting points
    }
    isGettingPoints = true;

    vtexjs.checkout.getOrderForm()
    .then((orderForm) => {
        var pickPoints = orderForm.shippingData.pickupPoints;
        validatePoints(pickPoints);
        isGettingPoints = false; // Set the flag to false when done
    })
  }

  // Función que se ejecuta con el click en el botón de "Envío a Domicilio"
  // Consulta el shippingData actual y lo reenvía con los datos de selectedDeliveryChannel, selectedSla y addressType que corresponden para evita el error
  function changeAddressDelivery() {
    vtexjs.checkout.getOrderForm()
    .then((orderForm) => {

        var shippingData = orderForm.shippingData

        shippingData.logisticsInfo.map((item) => {

          let sla = item.slas.find((sla) => sla.deliveryChannel == "delivery")
          let addressId = shippingData.availableAddresses.find((address) => address.addressId == item.addressId)
          let selectedAddress = shippingData.selectedAddresses.find((addr) => addr.addressId == addressId.addressId)

          return (
              item.selectedDeliveryChannel = "delivery",
              item.selectedSla = sla.id,
              selectedAddress.addressType = "residential"
          )
        })

        return vtexjs.checkout.sendAttachment('shippingData', shippingData)
    })
  }

  // Función que se ejecuta con el click en el botón de "Puntos de Retiro" y en el change del input donde se ingresa la dirección en el Modal de Pick-up-Points (el mapa)
  // Consulta el shippingData actual y lo reenvía con los datos de selectedDeliveryChannel, selectedSla y addressType que corresponden para evita el error
  function changeAddressPUP() {
    if(!blockedBtn){
      vtexjs.checkout.getOrderForm()
      .then((orderForm) => {

          var shippingData = orderForm.shippingData

          shippingData.logisticsInfo.map((item) => {

            let sla = item.slas.find((sla) => sla.deliveryChannel == "pickup-in-point")
            let addressId = shippingData.availableAddresses.find((address) => address.addressId == item.addressId)
            let selectedAddress = shippingData.selectedAddresses.find((addr) => addr.addressId == addressId.addressId)
  
            return (
                item.selectedDeliveryChannel = "pickup-in-point",
                item.selectedSla = sla.id,
                selectedAddress.addressType = "search"
            )
          })

          return vtexjs.checkout.sendAttachment('shippingData', shippingData)
      })
    }
  }

  // Handlers de los eventos

  function createListenerShipping(listenerFlag) {
    if (listenerFlag) {
      document
        .querySelector("#ship-postalCode")
        .addEventListener("change", event => getPickup());
      document
        .querySelector("#shipping-option-delivery")
        .addEventListener("click", changeAddressDelivery);
      document
        .querySelector("#shipping-option-pickup-in-point")
        .addEventListener("click", changeAddressPUP)
    }
  }

  function createListenerModal(listenerFlag) {
    if (listenerFlag) {
      document
        .querySelector('.pac-target-input')
        .addEventListener("change", changeAddressPUP)
    }
  }
  
});