import { nanoid, random } from "nanoid";
import { useState, useRef, useEffect } from "react";
import "./styles.css";
const matrix2D = Array.from({ length: 5 }, (num, row) =>
  Array.from({ length: 5 }, (_, col) => ({
    text: random(1).toString(),
    isChecked: row === 2 && col === 2 ? true : false,
    srcImg: "",
    id: nanoid()
  }))
);

function checkWin(gameBoard: typeof matrix2D) {
  const len = gameBoard.length;
  const { rightToBottom, leftToTop, rowMap, colMap } = gameBoard.reduce(
    (rowAcc, row, rowIdx) => {
      row.forEach((col, colIdx) => {
        if (!col.isChecked) return;
        if (rowIdx === colIdx) {
          rowAcc.rightToBottom += 1;
        }
        if (colIdx + rowIdx === gameBoard.length - 1) {
          rowAcc.leftToTop += 1;
        }
        rowAcc.rowMap[rowIdx] = rowAcc.rowMap[rowIdx] + 1 || 1;
        rowAcc.colMap[colIdx] = rowAcc.colMap[colIdx] + 1 || 1;
      });
      return rowAcc;
    },
    { rightToBottom: 0, leftToTop: 0, rowMap: [0], colMap: [0] }
  );
  if (rightToBottom === len || leftToTop === len) {
    return true;
  }
  const checkAny = (num: number) => len === num;
  if (rowMap.some(checkAny)) {
    return true;
  }
  return colMap.some(checkAny);
}

export default function App() {
  const [matrix, setMatrix] = useState(matrix2D);
  const dragRef = useRef<HTMLElement | null>(null);
  const dropTargetRef = useRef<HTMLElement | null>(null);
  const [gameWin, setGameWin] = useState(false);

  const handleDragStart = (event: React.DragEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    const { id } = target;
    const dragStartEvent = new DragEvent("drop", {
      view: window,
      bubbles: true,
      cancelable: true
    });
    console.log(dispatchEvent(dragStartEvent));
    target.classList.add("dragging");
    event.dataTransfer.setData("id", id);
    dragRef.current = target;

    event.dataTransfer.effectAllowed = "copyMove";
    event.dataTransfer.dropEffect = "move";

    console.log({ id }, "drag start");
  };

  const handleDragLeave = (
    event: React.DragEvent,
    dropTarget?: HTMLElement
  ) => {
    if (!dropTargetRef.current) return;

    dropTargetRef.current.style.opacity = "";
    dropTargetRef.current.style.backgroundColor = "";

    if (dropTarget) dropTargetRef.current = dropTarget;
  };

  const handleDragEnter = (event: React.DragEvent<HTMLElement>) => {
    event.dataTransfer.dropEffect = "move";
    const target = event.target as HTMLElement;
    const dropTarget = target.closest("[draggable]") as HTMLElement;
    if (dropTarget === null) return;
    if (dragRef.current?.id !== dropTarget.id) {
      console.log({ dropTarget: dropTarget.id }, target.id, "enter");
      dropTargetRef.current = dropTarget;
      dropTarget.style.opacity = "0.5";
      dropTarget.style.backgroundColor = "hsla(250, 80%, 90%, 0.8)";
    }
  };

  const handleDragEnd = (event: React.DragEvent, id: string) => {
    // event.preventDefault();
    const dragTarget = document.getElementById(id);
    if (!dragTarget) return;
    console.log(dragTarget.id, "drag end");
    dragTarget.classList.remove("dragging");
  };

  const swap = (
    { rowOne, colOne }: { rowOne: number; colOne: number },
    { rowTwo, colTwo }: { rowTwo: number; colTwo: number },
    array: typeof matrix
  ) => {
    const copyOne = { ...array[rowOne][colOne] };
    const copyTwo = { ...array[rowTwo][colTwo] };
    array[rowOne][colOne] = {
      ...copyTwo
    };
    array[rowTwo][colTwo] = {
      ...copyOne
    };
    return array;
  };

  const handleDrop = (event: React.DragEvent<HTMLElement>) => {
    const id = event.dataTransfer.getData("id");
    console.log({ id }, "drop");
    const dropTarget = event.target as HTMLElement;
    const [rowOne, colOne] = id.split(",").map((el) => Number(el));
    const parent = dropTarget.closest("[draggable]");
    if (parent === null) return;
    const [rowTwo, colTwo] = parent.id.split(",").map((el) => Number(el));
    if (rowOne === rowTwo && colOne === colTwo) return;
    setMatrix((prev) => {
      return [...swap({ rowOne, colOne }, { rowTwo, colTwo }, prev)];
    });
  };

  const handlePointerDown = (event: React.PointerEvent) => {
    // event.preventDefault();
    const target = event.target as HTMLElement;
    const dragTarget = target.closest("[draggable]") as HTMLElement;
    if (!dragTarget) return;
    const releasePointer = (event: React.PointerEvent) => () =>
      dragTarget.releasePointerCapture(event.pointerId);
    const release = releasePointer(event);
    dragTarget.onpointermove = (event) => {
      dragTarget.setPointerCapture(event.pointerId);

      console.log(event.target.id, "pointer move");
    };

    dragTarget.onpointercancel = (event) => {
      console.log(event.target.id, "pointer cancel");
      dragTarget.onpointerup = null;
      dragTarget.onpointercancel = null;
      dragTarget.onpointermove = null;
      release();
    };

    dragTarget.onpointerup = (event) => {
      console.log(event.target.id, "pointer up");
      dragTarget.onpointerup = null;
      dragTarget.onpointercancel = null;
      dragTarget.onpointermove = null;
      release();
    };
  };

  const handleClick = (
    event: React.MouseEvent,
    bool: boolean,
    row: number,
    col: number
  ) => {
    event.preventDefault();
    setMatrix((prev) => {
      const copy = prev.map((el) => el.map((el) => el));
      copy[row][col].isChecked = bool;
      return copy;
    });
  };

  useEffect(() => {
    const win = checkWin(matrix);
    if (win) {
      return setGameWin(true);
    } else if (!win && gameWin) {
      setGameWin(false);
    }
  }, [matrix, gameWin]);

  return (
    <div className="App">
      <section className="bingo-board">
        {matrix.map((rowArr, rowIndex) =>
          rowArr.map(({ text, id, srcImg, isChecked }, colIndex) => (
            <div
              key={id}
              id={`${rowIndex},${colIndex}`}
              className={isChecked ? `bingo-piece checked` : `bingo-piece`}
              onDragStart={handleDragStart}
              draggable={true}
              onDragEnter={handleDragEnter}
              onDragLeave={(event) =>
                handleDragLeave(event, event.target as HTMLElement)
              }
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onDragEnd={(event) => {
                handleDragEnd(event, dragRef.current?.id || "");
              }}
              onClick={(event) =>
                handleClick(event, !isChecked, rowIndex, colIndex)
              }
              onPointerDown={handlePointerDown}
            >
              {rowIndex === 2 && colIndex === 2 ? (
                <p>
                  free bingo piece <sub>{text}</sub>
                </p>
              ) : (
                text
              )}
            </div>
          ))
        )}
      </section>
      {gameWin && <h2>BINGO!!!!</h2>}
    </div>
  );
}
