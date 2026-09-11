
// Props — Build a ProductCard component that accepts name, price, image, rating, and an optional discount (default 0). Display the discounted price when discount > 0.


function ProductCard({ name, price, image, rating, discount = 0 }) {
    const finalPrice = discount > 0 ? price - (price * discount / 100) : price;

    return (
        <div className="product-card">
            <img src={image} alt={name} />
            <h3>{name}</h3>
            <p>Rating: {rating}</p>

            {discount > 0 ? (
                <p>
                    <span style={{ textDecoration: 'line-through' }}>${price}</span>
                    <strong>${finalPrice}</strong>
                    ({discount}% OFF)
                </p>
            ) : (
                <p><strong>${price}</strong></p>
            )}
        </div>
    );
}

export default ProductCard;