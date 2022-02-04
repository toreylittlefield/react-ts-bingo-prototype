import BingoBoard from './BingoBoard';

const App = () => {
  return (
    <div className="App">
      <section className="boards-container">
        <BingoBoard />
        <BingoBoard />
      </section>
    </div>
  );
};

export default App;
