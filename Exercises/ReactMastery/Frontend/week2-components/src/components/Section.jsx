// children prop — Build a Section component that accepts a title prop and renders any children inside a styled <section> element with the title as a <h2>.
import './Section.css'

function Section({ title, children }) {
    return (
        <section className="section-container">
            <h2>{title}</h2>
            {children}
        </section>
    );
}

export default Section;