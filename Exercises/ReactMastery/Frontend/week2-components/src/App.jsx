import './App.css'
import ProductCard from './components/ProductCard'
import Section from './components/Section';

// const products = [
//   {
//     id: 1,
//     name: 'Wireless Headphones',
//     price: 120,
//     image: '/Images/headphone.png',
//     rating: 4.5,
//     discount: 15,
//   },
//   {
//     id: 2,
//     name: 'Mechanical Keyboard',
//     price: 85,
//     image: '/Images/keyboard.png',
//     rating: 4.8,
//   },
//   {
//     id: 3,
//     name: 'Gaming Mouse',
//     price: 50,
//     image: '/Images/mouse.png',
//     rating: 4.2,
//     discount: 10,
//   }
// ];

function App() {

  return (

    //Product Card
    // <div>
    //   {products.map((product) => (
    //     <ProductCard
    //       key={product.id}
    //       name={product.name}
    //       price={product.price}
    //       image={product.image}
    //       rating={product.rating}
    //       discount={product.discount}
    //     />
    //   ))}
    // </div>

    <Section title="My Custom Section">
      <p>This text is passed as a children</p>
    </Section>

  )
}

export default App
