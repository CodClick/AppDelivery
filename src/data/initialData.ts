const initialData = {
  categories: [
    { id: "c1", name: "Pizzas", empresa_id: "d2111847-f0ed-467d-a0b4-4ca31feaa7b4" },
    { id: "c2", name: "Massas", empresa_id: "d2111847-f0ed-467d-a0b4-4ca31feaa7b4" },
    { id: "c3", name: "Bebidas", empresa_id: "d2111847-f0ed-467d-a0b4-4ca31feaa7b4" },
    { id: "c4", name: "Sobremesas", empresa_id: "d2111847-f0ed-467d-a0b4-4ca31feaa7b4" },
  ],
  variations: [
    { id: "v1", name: "Borda de Catupiry", price: 5.00, category_id: "c1", empresa_id: "d2111847-f0ed-467d-a0b4-4ca31feaa7b4" },
    { id: "v2", name: "Borda de Cheddar", price: 6.00, category_id: "c1", empresa_id: "d2111847-f0ed-467d-a0b4-4ca31feaa7b4" },
    { id: "v3", name: "Extra Bacon", price: 3.50, category_id: "c1", empresa_id: "d2111847-f0ed-467d-a0b4-4ca31feaa7b4" },
    { id: "v4", name: "Extra Queijo", price: 4.00, category_id: "c2", empresa_id: "d2111847-f0ed-467d-a0b4-4ca31feaa7b4" },
    { id: "v5", name: "Coca-cola 2L", price: 10.00, category_id: "c3", empresa_id: "d2111847-f0ed-467d-a0b4-4ca31feaa7b4" },
  ],
  variationGroups: [
    { id: "vg1", name: "Bordas", is_required: false, empresa_id: "d2111847-f0ed-467d-a0b4-4ca31feaa7b4", variations: [{ id: "v1", name: "Borda de Catupiry", price: 5.00, category_id: "c1", empresa_id: "d2111847-f0ed-467d-a0b4-4ca31feaa7b4" }, { id: "v2", name: "Borda de Cheddar", price: 6.00, category_id: "c1", empresa_id: "d2111847-f0ed-467d-a0b4-4ca31feaa7b4" }] },
    { id: "vg2", name: "Adicionais", is_required: false, empresa_id: "d2111847-f0ed-467d-a0b4-4ca31feaa7b4", variations: [{ id: "v3", name: "Extra Bacon", price: 3.50, category_id: "c1", empresa_id: "d2111847-f0ed-467d-a0b4-4ca31feaa7b4" }, { id: "v4", name: "Extra Queijo", price: 4.00, category_id: "c2", empresa_id: "d2111847-f0ed-467d-a0b4-4ca31feaa7b4" }] },
  ],
  menuItems: [
    { id: "i1", name: "Pizza Calabresa", description: "Deliciosa pizza de calabresa com cebola e queijo.", price: 45.00, category_id: "c1", image_url: "https://placehold.co/600x400/FFF6E4/FF9900?text=Pizza+Calabresa", empresa_id: "d2111847-f0ed-467d-a0b4-4ca31feaa7b4" },
    { id: "i2", name: "Lasanha Bolonhesa", description: "Tradicional lasanha com molho de carne e queijo.", price: 35.00, category_id: "c2", image_url: "https://placehold.co/600x400/FFF6E4/FF9900?text=Lasanha", empresa_id: "d2111847-f0ed-467d-a0b4-4ca31feaa7b4" },
  ],
};

export default initialData;
