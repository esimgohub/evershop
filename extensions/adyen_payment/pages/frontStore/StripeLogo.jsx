import PropTypes from 'prop-types';
import React from 'react';

export default function AdyenLogo({ width = 100, height = 30 }) {
  return (
    <img
      width={width}
      height={height}
      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAmCAYAAAAMe5M4AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAd2SURBVHgB7ZxtaBRHGMefe01y5s3UqiUmlaqlNgm1JU2ICdSqIEk/qIEE/dBGsNBKG7GhSi2FplCKtRAa0mItLTb1g/YC0S+NBNparGeI2GIxIQULamJpFJEkJppcsrfOfzdzt3vZ83YuZ+64ux+Me7s7O5eb5z/PPPPiWihABktpLFkpsZBYmmRpisRIivqwz17MxufOzs6C8vLyKkogPIz6+vpB9tHB0rjJx5KqPqDyvDt37nwuJyj4bfiNLKWbqKOkqg8b+yfT7XavLC0tPU4JisvlqpQk6ei5c+dmSHV/jyKp6gP9m62SQQnOnj17ashcf55U9ZFoAU4KQVICSHIeqwB814fINzJmOr/sHSP53hClWDjsFEWmf++hqfYO8rIjjM+x5GaTfV0Rpe2qI8crFWRbWaBch8F9V90kDXaTfLdfOfc/k1dEVpZsq+vI+lQFpXg8REUAMPz9T1qUoxEy8wK4h2Rlxs/Yt5ucm4lmLrfojK57hglCQvrXTZbMAnJWq8cU0WXeAnjQ+h1N7Gs2nV++PUS2s/uI/peJVuWyv8AS/pnxIZrqqGBepInsLzZRiugxLwGg1d9vbjGd3+Iiyto6Qk7nBNEwC0DGp8n7wpMkmxABgMcAKRFEj4gFMHW6W8j4wFVxTzX+LBYmANuNMZpZlWO6DIgAMYF1eWzighOdVwyvV5YXUmH+3N/huThIgzdHlc+FK3KosqyQun65SqNjk4bPeXpZ/v/U/DnZ6ZSTlcaOaVS8dtncsjV5edmiRCyAifeaRbKTc900ZayY29/bb46T74l08uWmkVmm/2gi59ZusjizaaGBUS4wo55hRuSVz/nrt7epIEgEjR900dBsvrZDNcpx78GfmQDUtanTx3cqAkBZe1leCMaIs6d36UQAETW80+k/r9m8JiIBRDQMnPzBrYvyzZDxzGjIe/Yb90gExAQSGz3EAlT0px9uoj+Zsdu/rtW1XhhFC1rokEYkMFDfwG2/8UHxc0sV4297/URI4xt5gDPB3xXi2XBE5AEmW78Xym9bKpEjK/RqrHVkSkkiXsDHho5U9CbFEogBBv7os1+V876BW7r7J0/1+T/v2F6seIcrAwHDFa9dqngUGFMrFHiFEiYMcOWf27p7AII5eUrfFUFUyFeQb747BcIeAEO6mcv9Qs84ljwIm8cyMUMi+IZ7Qg4hFxKIgOO5GPCKwUY60Fg1myfQUos1RuagtcOI2UwYSPAaO7aX6L7zizaPPy/EwjnfK+4FhAUganzgWBZ+L4Z13EuiyMM9FGtgLBgCoAXy4O6CxhiVZQX+ltk/EDA2AkD1fqDvRkveuO0YnQwRbAIuoupNar/Pv79fIySzCAtAui4+VWt1ymHzWCYlEkWeGqV4AIbg9M0a4fBXHv+1HbUlmvuBboJ7AHgRbSuHCBoPdtFLG7+ZE2hCGLxLeKuhVDlycfUNLIAAUsxlvaYFwwhdmj4dQSI3rjYADA7sMELY31ipCypRBrwB9yrg6I+X/OXy57mQtOIyi7AArIvFggwgTYSPNWW7uBYtWfExNVxVrhXALfpJ0/fzVsrvcbjRtBx4t0rp07VxBQTDg0mMKngrR6vHuUfpaiz+vMGBaDiERwFYzBFl5i77mlWPziMyAuBgwSgegDGQhpTAr093rzpEkGg0scPLwvBy9ctf+r0F9wDashEHeN6YG/ThO0KVbYSwALCy59hQEXLhxwhpLLxxfTliAsBKYSwmgkIBQ3/bfkl3jQ/9OFoXvb5M9V7o02E0PF+Yr/4eGFo7V4Bg0WjoZ8Rj9wDAuW2LkACmbzpoejiNHMuNRwO+TCfJmWJ/iq1oN8UTRi5dG/yp7jkQpJXMtlIYH4YNZVx0IYj0D7ed919D//9+Y2DXGjwPHxpqvYwZIgoC0xvqlWVdEe7/nRXynpS/iETAsrBtdT3FEzWbn9WdY5KnskwfG2jvBTyD7B/GacE1zDgiAa37R7C4kwWWPCF2MBqKmiEiD4BuIOtYC42+Wmf6GXiAyRuLKP3pCd11KT+TpOUuEsFe3kzxBgyAtQCA1h5sVCzWoG/HdW2k33botbBlo7z9mhZvNOePsoOHjGaIeDEIcYDr4yZlSdgsExeyyZ7lJXvetHIuZzpoZqVYP46lYFvhFopHeKsuyDe+JzpNy4FodgbNBgYDUUSylXle8wCu5iZFBGaRvVYa7V5C3hEXSctcQnsBAFo+NoWkiB7zngiCCBZf6zEfE7hySdrQSnJDK1GuueVLrP07qzvI/nxsF38SkajsCcQmz7xr6p6/yfYOkth6gXbNgG8KdW7dQmm7WACZq7p9uHIs6khXO+ZuCmWBHgxvW1MXs80fyUBUdwUjLkDiKHsGcnP8Bg9GjeYDEb0iAO9oavPnAhJVAQQjOlRUJnbiaHInGUgtBiU5KQEkORCA78iRI12U4ODFCKS+HSMcSVcfeGlC3sjIyCE5QcFvI/WFCGZWnJKqPvgsTCZLTrfbXZho/ze+t7f3fG1tLVZIsOnQ7CbCpKkP7TQcWgfUb6PEwkfqC5HC70zVkxT18RD84H/IwaDFuAAAAABJRU5ErkJggg=="
      alt="Stripe"
      role="presentation"
    />
  );
}

AdyenLogo.propTypes = {
  height: PropTypes.number,
  width: PropTypes.number
};

AdyenLogo.defaultProps = {
  height: 24,
  width: 24
};
