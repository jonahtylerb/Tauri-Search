<script>
  import { slide } from "svelte/transition";
  import { tweened } from "svelte/motion";
  import {onMount} from "svelte";
  import Fuse from "fuse.js";
  import bibleData from "./bibleData";
  import { cubicInOut, cubicOut } from "svelte/easing";
  import "@fontsource/comfortaa"
  import "@fontsource/kode-mono/400.css"

  const fuse = new Fuse(bibleData, {
    keys: ["book", "abbr"],
    threshold: 1,
  });

  const total = tweened(0, {
    duration: 500,
    easing: cubicInOut,
  });

  let booksResults = $state(bibleData);
  let book = $state("01");
  let bookFocused = $state(false);
  let bookInputValue = $state("");

  function arrow(e) {
    const currentTab = document.activeElement?.getAttribute("tabindex");
    if (e.key === "ArrowDown") {
      const newTab = document.querySelector(`[tabindex="${+currentTab + 1}"]`);
      if (newTab) {
        book = newTab.id;
        newTab.focus();
      }
      return true;
    } else if (e.key === "ArrowUp") {
      const newTab = document.querySelector(`[tabindex="${+currentTab - 1}"]`);
      if (newTab) {
        book = newTab.id;
        newTab.focus();
      }
      return true;
    }
    return false;
  }

  function bookInput(e) {
    if (arrow(e)) return;
    if (!bookInputValue) {
      booksResults = bibleData;
      return;
    }
    booksResults = fuse.search(bookInputValue).map((result) => result.item);
    if (booksResults.length === 0) {
      booksResults = bibleData;
      return;
    }
    book = booksResults[0].index;
  }

  let chapter = $state("");
  $effect(() => {
    const maxChapter = bibleData[+book - 1].chapters.length;
    if (!maxChapter || !chapter) return;

    if (+chapter > maxChapter) {
      chapter = maxChapter.toString();
    }

    if (chapter.toString().length === maxChapter.toString().length) {
      document.getElementById("verse")?.focus();
    }
  });

  let verse = $state("");
  $effect(() => {
    const maxVerse = bibleData[+book - 1].chapters[+chapter - 1];
    if (!maxVerse || !verse) return;

    if (+verse > maxVerse) {
      verse = maxVerse.toString();
    }

    if (verse.toString().length === maxVerse.toString().length) {
      submit();
    }
  });

  function removeFocus() {
    bookFocused = false;
    bookInputValue = bibleData[+book - 1].book;
  }

  let link = $state();

  function submit() {
    let formattedChapter = "001";
    let formattedVerse = "000";

    if (!link) return;

    if (chapter) {
      formattedChapter = chapter.toString().padStart(3, "0");
      if (verse) {
        formattedVerse = verse.toString().padStart(3, "0");
      }
      link.href = `https://www.jw.org/finder?pub=nwtsty&bible=${book}${formattedChapter}${formattedVerse}`;
    } else {
      link.href = `https://www.jw.org/finder?pub=nwtsty&book=${+book}`;
    }

    book = "01";
    chapter = "";
    verse = "";
    bookInputValue = "";
    booksResults = bibleData;

    document.getElementById("book")?.focus();

    link.click();
  }

  $effect(() => {
    total.set(
      parseInt(
        book +
          (chapter ? chapter.toString().padStart(3, "0") : "001") +
          (verse ? verse.toString().padStart(3, "0") : "000"),
      ),
    );
  });

  onMount(() => {
    document.getElementById("book")?.focus();
  })
</script>

<div
  onkeydown={(e) => {
    if (e.key === "Enter") {
      submit();
    }
    if (arrow(e)) return;
  }}
  data-all="transition-all duration-300 text-gray-2"
  class="bg-gray-950 h-full w-full flex flex-col bg-hero-topography-gray-800/20"
>
  <form
    class="flex flex-row gap-2 items-stretch w-91% sm:gap-5 pt-5 mb-0 px-5"
    data-children="bg-gray-950 w-0 border-none outline-none focus:ring-orange-600 ring-gray-800/50 ring-2 p-3 rounded-md focus:w-full"
    data-children-placeholder="text-gray-2/50"
  >
    <input
      autocomplete="off"
      onfocus={() => (bookFocused = true)}
      class:w-full={bookFocused}
      bind:value={bookInputValue}
      onkeyup={bookInput}
      type="text"
      placeholder="Book"
      id="book"
    />
    <input
      onfocus={removeFocus}
      autocomplete="off"
      type="number"
      min="0"
      max="999"
      bind:value={chapter}
      placeholder={`Chapter - Max: ${bibleData[+book - 1].chapters.length}`}
      id="chapter"
    />
    <input
      onfocus={removeFocus}
      type="number"
      autocomplete="off"
      min="0"
      max="999"
      bind:value={verse}
      id="verse"
      placeholder={`Verse${chapter ? " - Max: " + bibleData[+book - 1].chapters[chapter - 1] : ""}`}
    />
  </form>
  {#if bookFocused}
    <section
      transition:slide={{ duration: 200, easing: cubicInOut }}
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 px-5 justify-start overflow-y-auto py-5"
      id="results"
    >
      {#each booksResults as bookObj, i (bookObj.index)}
        <button
          id={bookObj.index}
          class:ring-orange-600={book === bookObj.index}
          onclick={() => {
            bookInputValue = bookObj.book;
            book = bookObj.index;
            document.getElementById("chapter")?.focus();
          }}
          onkeydown={(e) => {
            if (e.key === "Tab") {
              e.preventDefault();
              bookInputValue = bookObj.book;
              book = bookObj.index;
              document.getElementById("chapter")?.focus();
            } else if (e.key !== "ArrowUp" && e.key !== "ArrowDown") {
              document.getElementById("results").scrollTop = 0;
              document.getElementById("book")?.focus();
            }
          }}
          tabindex={i}
          class="bg-transparent backdrop-blur-5 ring-gray-800/50 flex flex-roe items-center justify-between border-none outline-none ring-2 focus:ring-orange-600 p-3 rounded-md h-10"
        >
          {bookObj.book}
          <span class="opacity-20">{bookObj.chapters.length}</span>
        </button>
      {/each}
    </section>
  {/if}
</div>
<h1
  class="m-0 w-full shadow-[0_0_1rem_rgba(0,0,0,0.2)] shadow-black text-center bg-gray-950 ring-2 ring-gray-800/20 text-base font-100 text-gray-2/50 absolute bottom-0 py-1"
>
  {Math.floor($total).toString().padStart(8, "0")}
</h1>
<a target="_blank" href="https://www.jw.org" bind:this={link} class="hidden"
  >Link</a
>
<style>
  *{
    font-family: Comfortaa, sans-serif;
  }
  h1 {
    font-family: Kode Mono, monospace;
  }
</style>
